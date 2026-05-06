import type { ExchangeRate } from "../../domain/money";
import { seedRates } from "../../data/seedRates";
import { getSupabaseClient } from "../supabase/client";
import { loadRatesCache, saveRatesCache } from "./localRatesCache";
import { mapRateRow, type ExchangeRateRow } from "./types";

export type RatesLoadSource = "supabase" | "cache" | "seed";

export type RatesLoadResult = {
  rates: ExchangeRate[];
  source: RatesLoadSource;
  message: string;
};

function fallbackResult(cached: ExchangeRate[], message: string): RatesLoadResult {
  if (cached.length > 0) {
    return { rates: cached, source: "cache", message };
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

  const rates = (data as ExchangeRateRow[]).map(mapRateRow);
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
