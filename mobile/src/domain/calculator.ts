import type {
  ExchangeRate,
  PaymentComparisonResult,
  PaymentKind,
  PaymentOptionInput,
  RateCode,
} from "./money";

function getRateValue(rates: ExchangeRate[], code: RateCode): number {
  const rate = rates.find((item) => item.code === code);

  if (!rate || rate.value <= 0) {
    throw new Error(`Falta la tasa ${code}.`);
  }

  return rate.value;
}

function toVes(option: PaymentOptionInput, rates: ExchangeRate[], cashUsdRate: number): number {
  const handlers: Record<PaymentKind, () => number> = {
    usd_divisas: () => option.amount * getRateValue(rates, "usd_parallel"),
    ves_bcv: () => option.amount,
    ves_parallel: () => option.amount,
    eur: () => option.amount * getRateValue(rates, "eur_bcv"),
    usd_cash: () => option.amount * cashUsdRate,
  };

  return Number(handlers[option.kind]().toFixed(2));
}

export function comparePaymentOptions(
  options: PaymentOptionInput[],
  rates: ExchangeRate[],
  cashUsdRate: number,
): PaymentComparisonResult[] {
  if (cashUsdRate <= 0) {
    throw new Error("La tasa de efectivo debe ser mayor a cero.");
  }

  if (options.length === 0) {
    return [];
  }

  const displayUsdRate = getRateValue(rates, "usd_parallel");
  const priced = options.map((option) => {
    const equivalentVes = toVes(option, rates, cashUsdRate);

    return {
      option,
      equivalentVes,
      equivalentUsd: Number((equivalentVes / displayUsdRate).toFixed(2)),
    };
  });

  const bestCost = Math.min(...priced.map((item) => item.equivalentVes));

  return priced
    .map((item) => {
      const differenceVes = Number((item.equivalentVes - bestCost).toFixed(2));

      return {
        optionId: item.option.id,
        label: item.option.label,
        equivalentVes: item.equivalentVes,
        equivalentUsd: item.equivalentUsd,
        differenceVes,
        differencePercent: bestCost === 0 ? 0 : Number(((differenceVes / bestCost) * 100).toFixed(2)),
        isBest: item.equivalentVes === bestCost,
      };
    })
    .sort((a, b) => a.equivalentVes - b.equivalentVes);
}
