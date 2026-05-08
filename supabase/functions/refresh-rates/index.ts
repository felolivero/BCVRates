import { createClient } from "@supabase/supabase-js";

type DolarApiRate = {
  fuente: string;
  nombre: string;
  moneda?: string;
  compra?: number;
  venta?: number;
  promedio: number;
  fechaActualizacion: string;
};

type RateUpsert = {
  code: "usd_bcv" | "usdt_binance" | "eur_bcv";
  base_currency: "USD" | "EUR";
  quote_currency: "VES";
  value: number;
  source: "dolarapi";
  source_name: string;
  source_updated_at: string;
  fetched_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function assertRate(data: DolarApiRate, label: string) {
  if (!Number.isFinite(data.promedio) || data.promedio <= 0) {
    throw new Error(`DolarApi devolvio una tasa invalida para ${label}.`);
  }
}

function mapEuroRate(data: DolarApiRate): RateUpsert {
  assertRate(data, "eur_bcv");

  return {
    code: "eur_bcv",
    base_currency: "EUR",
    quote_currency: "VES",
    value: data.promedio,
    source: "dolarapi",
    source_name: "Euro oficial",
    source_updated_at: data.fechaActualizacion,
    fetched_at: new Date().toISOString(),
  };
}

async function fetchEuroRate(): Promise<RateUpsert> {
  const response = await fetch("https://ve.dolarapi.com/v1/euros");
  if (!response.ok) throw new Error("DolarApi fallo: https://ve.dolarapi.com/v1/euros");

  const data = (await response.json()) as DolarApiRate[];
  const official = data.find((item) => item.fuente.toLowerCase() === "oficial");

  if (!official) {
    throw new Error("No se encontro euro oficial en DolarApi.");
  }

  return mapEuroRate(official);
}

async function fetchUsdRates(): Promise<[RateUpsert, RateUpsert]> {
  const response = await fetch("https://ve.dolarapi.com/v1/dolares");
  if (!response.ok) throw new Error("DolarApi fallo: https://ve.dolarapi.com/v1/dolares");

  const data = (await response.json()) as DolarApiRate[];
  const official = data.find((item) => item.fuente.toLowerCase() === "oficial");
  const usdt = data.find((item) => item.fuente.toLowerCase() !== "oficial");

  if (!official || !usdt) {
    throw new Error("No se encontraron las tasas USD necesarias en DolarApi.");
  }

  assertRate(official, "usd_bcv");
  assertRate(usdt, "usdt_binance");

  return [
    {
      code: "usd_bcv",
      base_currency: "USD",
      quote_currency: "VES",
      value: official.promedio,
      source: "dolarapi",
      source_name: "Dolar oficial BCV",
      source_updated_at: official.fechaActualizacion,
      fetched_at: new Date().toISOString(),
    },
    {
      code: "usdt_binance",
      base_currency: "USD",
      quote_currency: "VES",
      value: usdt.promedio,
      source: "dolarapi",
      source_name: "USDT (Binance)",
      source_updated_at: usdt.fechaActualizacion,
      fetched_at: new Date().toISOString(),
    },
  ];
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: "Faltan variables de entorno de Supabase." },
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const [[usdBcv, usdtBinance], euroBcv] = await Promise.all([fetchUsdRates(), fetchEuroRate()]);

    const rates = [usdBcv, usdtBinance, euroBcv];
    const { error: clearError } = await supabase.from("exchange_rates").delete().neq("code", "");

    if (clearError) {
      return Response.json({ error: clearError.message }, { status: 500, headers: corsHeaders });
    }

    const { error: upsertError } = await supabase.from("exchange_rates").upsert(rates, { onConflict: "code" });

    if (upsertError) {
      return Response.json({ error: upsertError.message }, { status: 500, headers: corsHeaders });
    }

    const { error: historyError } = await supabase.from("exchange_rate_history").insert(rates);

    if (historyError) {
      return Response.json({ error: historyError.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({ ok: true, rates }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al refrescar tasas.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
