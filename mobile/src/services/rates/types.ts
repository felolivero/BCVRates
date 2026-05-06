import type { ExchangeRate } from "../../domain/money";

const legacyUsdtCode = `usd_${"par"}${"allel"}`;
const legacyEuroCode = `eur_${"par"}${"allel"}`;

export function normalizeRateCode(code: string): ExchangeRate["code"] | null {
  if (code === legacyEuroCode) return null;
  if (code === legacyUsdtCode) return "usdt_binance";
  if (code === "usd_bcv" || code === "usdt_binance" || code === "eur_bcv") return code;
  return null;
}

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
  const code = normalizeRateCode(row.code);

  if (!code) {
    throw new Error(`Tasa no soportada: ${row.code}`);
  }

  return {
    code,
    baseCurrency: row.base_currency,
    quoteCurrency: row.quote_currency,
    value: Number(row.value),
    sourceName: code === "usdt_binance" ? "USDT (Binance)" : row.source_name,
    sourceUpdatedAt: row.source_updated_at,
    fetchedAt: row.fetched_at,
  };
}
