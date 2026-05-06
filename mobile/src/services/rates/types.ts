import type { ExchangeRate } from "../../domain/money";

export type ExchangeRateRow = {
  code: string;
  base_currency: "USD" | "EUR";
  quote_currency: "VES";
  value: number | string;
  source_name: string;
  source_updated_at: string;
  fetched_at: string;
};

export function mapRateRow(row: ExchangeRateRow): ExchangeRate {
  return {
    code: row.code as ExchangeRate["code"],
    baseCurrency: row.base_currency,
    quoteCurrency: row.quote_currency,
    value: Number(row.value),
    sourceName: row.source_name,
    sourceUpdatedAt: row.source_updated_at,
    fetchedAt: row.fetched_at,
  };
}
