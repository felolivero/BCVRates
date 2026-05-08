import { useCallback, useEffect, useState } from "react";
import type { ExchangeRate } from "../domain/money";
import { seedRates } from "../data/seedRates";
import { loadRates, refreshRates, type RatesLoadSource } from "../services/rates/ratesRepository";

type RatesState = {
  rates: ExchangeRate[];
  source: RatesLoadSource;
  message: string;
  loading: boolean;
};

export function useRates() {
  const [state, setState] = useState<RatesState>({
    rates: seedRates,
    source: "seed",
    message: "Cargando tasas...",
    loading: true,
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    const result = await loadRates();
    setState({ ...result, loading: false });
  }, []);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    const result = await refreshRates();
    setState({ ...result, loading: false });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refresh, reload: load };
}
