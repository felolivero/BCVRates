import type { ExchangeRate } from "../domain/money";

export const seedRates: ExchangeRate[] = [
  {
    code: "usd_bcv",
    baseCurrency: "USD",
    quoteCurrency: "VES",
    value: 100,
    sourceName: "USD oficial BCV",
    sourceUpdatedAt: "2026-05-06T12:00:00Z",
    fetchedAt: "2026-05-06T12:05:00Z",
  },
  {
    code: "usd_parallel",
    baseCurrency: "USD",
    quoteCurrency: "VES",
    value: 150,
    sourceName: "USD paralelo / USDT",
    sourceUpdatedAt: "2026-05-06T12:00:00Z",
    fetchedAt: "2026-05-06T12:05:00Z",
  },
  {
    code: "eur_bcv",
    baseCurrency: "EUR",
    quoteCurrency: "VES",
    value: 110,
    sourceName: "EUR oficial",
    sourceUpdatedAt: "2026-05-06T12:00:00Z",
    fetchedAt: "2026-05-06T12:05:00Z",
  },
  {
    code: "eur_parallel",
    baseCurrency: "EUR",
    quoteCurrency: "VES",
    value: 160,
    sourceName: "EUR paralelo",
    sourceUpdatedAt: "2026-05-06T12:00:00Z",
    fetchedAt: "2026-05-06T12:05:00Z",
  },
];
