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
  code: "usd_bcv" | "usd_parallel" | "eur_bcv" | "eur_parallel";
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

async function fetchSingleRate(
  code: RateUpsert["code"],
  baseCurrency: RateUpsert["base_currency"],
  url: string,
  sourceName: string,
): Promise<RateUpsert> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DolarApi fallo: ${url}`);

  const data = (await response.json()) as DolarApiRate;
  assertRate(data, code);

  return {
    code,
    base_currency: baseCurrency,
    quote_currency: "VES",
    value: data.promedio,
    source: "dolarapi",
    source_name: sourceName,
    source_updated_at: data.fechaActualizacion,
    fetched_at: new Date().toISOString(),
  };
}

function mapEuroRate(data: DolarApiRate, code: "eur_bcv" | "eur_parallel"): RateUpsert {
  assertRate(data, code);

  return {
    code,
    base_currency: "EUR",
    quote_currency: "VES",
    value: data.promedio,
    source: "dolarapi",
    source_name: code === "eur_bcv" ? "Euro oficial" : "Euro paralelo",
    source_updated_at: data.fechaActualizacion,
    fetched_at: new Date().toISOString(),
  };
}

async function fetchEuroRates(): Promise<RateUpsert[]> {
  const response = await fetch("https://ve.dolarapi.com/v1/euros");
  if (!response.ok) throw new Error("DolarApi fallo: https://ve.dolarapi.com/v1/euros");

  const data = (await response.json()) as DolarApiRate[];
  const official = data.find((item) => item.fuente.toLowerCase() === "oficial");
  const parallel = data.find((item) => item.fuente.toLowerCase() === "paralelo");

  if (!official || !parallel) {
    throw new Error("No se encontraron euro oficial y euro paralelo en DolarApi.");
  }

  return [mapEuroRate(official, "eur_bcv"), mapEuroRate(parallel, "eur_parallel")];
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
    const [usdBcv, usdParallel, euroRates] = await Promise.all([
      fetchSingleRate("usd_bcv", "USD", "https://ve.dolarapi.com/v1/dolares/oficial", "Dólar oficial BCV"),
      fetchSingleRate("usd_parallel", "USD", "https://ve.dolarapi.com/v1/dolares/paralelo", "Dólar paralelo / USDT"),
      fetchEuroRates(),
    ]);

    const rates = [usdBcv, usdParallel, ...euroRates];
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
