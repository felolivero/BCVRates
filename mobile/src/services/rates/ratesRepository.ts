import type { ExchangeRate } from "../../domain/money";
import { seedRates } from "../../data/seedRates";
import { getSupabaseClient } from "../supabase/client";
import { loadRatesCache, saveRatesCache } from "./localRatesCache";
import { mapRateRow, normalizeRateCode, type ExchangeRateRow } from "./types";

export type RatesLoadSource = "supabase" | "cache" | "seed";

export type RatesLoadResult = {
  rates: ExchangeRate[];
  source: RatesLoadSource;
  message: string;
};

const supportedRateCodes = new Set(["usd_bcv", "usdt_binance", "eur_bcv"]);

function normalizeCachedRates(rates: ExchangeRate[]) {
  return rates
    .map((rate) => {
      const code = normalizeRateCode(rate.code);
      if (!code) return null;
      return {
        ...rate,
        code,
        sourceName: code === "usdt_binance" ? "USDT (Binance)" : rate.sourceName,
      };
    })
    .filter((rate): rate is ExchangeRate => Boolean(rate));
}

function fallbackResult(cached: ExchangeRate[], message: string): RatesLoadResult {
  const supportedCached = normalizeCachedRates(cached).filter((rate) => supportedRateCodes.has(rate.code));

  if (supportedCached.length > 0) {
    return { rates: supportedCached, source: "cache", message };
  }

  return { rates: seedRates, source: "seed", message };
}

export async function loadRates(): Promise<RatesLoadResult> {
  const cached = await loadRatesCache();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return fallbackResult(cached, "Supabase no esta configurado. Usando tasas alpha.");
  }

  const { data, error } = await supabase.from("exchange_rates").select("*").order("code");

  if (error || !data) {
    return fallbackResult(cached, error?.message ?? "No se pudieron cargar tasas desde Supabase.");
  }

  const rates = (data as ExchangeRateRow[])
    .filter((row) => normalizeRateCode(row.code))
    .map(mapRateRow)
    .filter((rate) => supportedRateCodes.has(rate.code));
  await saveRatesCache(rates);

  return { rates, source: "supabase", message: "Tasas cargadas desde Supabase." };
}

export async function refreshRates(): Promise<RatesLoadResult> {
  const cached = await loadRatesCache();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return fallbackResult(cached, "Configura Supabase para refrescar tasas reales.");
  }

  const { error } = await supabase.functions.invoke("refresh-rates");

  if (error) {
    return fallbackResult(cached, error.message);
  }

  return loadRates();
}
