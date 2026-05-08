export type CurrencyCode = "USD" | "VES" | "EUR";

export type RateCode = "usd_bcv" | "usdt_binance" | "eur_bcv" | "usd_cash";

export type PaymentKind =
  | "usd_cash"
  | "ves_bcv"
  | "ves_usdt"
  | "eur";

export type ExchangeRate = {
  code: RateCode;
  baseCurrency: "USD" | "EUR";
  quoteCurrency: "VES";
  value: number;
  sourceName: string;
  sourceUpdatedAt: string;
  fetchedAt: string;
};

export type PaymentOptionInput = {
  id: string;
  label: string;
  amount: number;
  kind: PaymentKind;
};

export type PaymentComparisonResult = {
  optionId: string;
  label: string;
  equivalentVes: number;
  equivalentUsd: number;
  differenceVes: number;
  differencePercent: number;
  isBest: boolean;
};

export type SellInstrument = "divisas" | "usdt_binance";

export type SellScenarioResult = {
  instrument: SellInstrument;
  usdAmount: number;
  usedRate: number;
  receivedVes: number;
  differenceVsBestVes: number;
};
