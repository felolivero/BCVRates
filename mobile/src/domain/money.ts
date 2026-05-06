export type CurrencyCode = "USD" | "VES" | "EUR";

export type RateCode = "usd_bcv" | "usd_parallel" | "eur_bcv" | "eur_parallel" | "usd_cash";

export type PaymentKind =
  | "usd_divisas"
  | "ves_bcv"
  | "ves_parallel"
  | "eur"
  | "usd_cash";

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
