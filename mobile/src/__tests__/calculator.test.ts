import { describe, expect, it } from "vitest";
import { comparePaymentOptions } from "../domain/calculator";
import type { ExchangeRate, PaymentOptionInput } from "../domain/money";

const rates: ExchangeRate[] = [
  {
    code: "usd_bcv",
    baseCurrency: "USD",
    quoteCurrency: "VES",
    value: 100,
    sourceName: "BCV",
    sourceUpdatedAt: "2026-05-06T00:00:00Z",
    fetchedAt: "2026-05-06T00:00:00Z",
  },
  {
    code: "usd_parallel",
    baseCurrency: "USD",
    quoteCurrency: "VES",
    value: 150,
    sourceName: "Paralelo",
    sourceUpdatedAt: "2026-05-06T00:00:00Z",
    fetchedAt: "2026-05-06T00:00:00Z",
  },
  {
    code: "eur_bcv",
    baseCurrency: "EUR",
    quoteCurrency: "VES",
    value: 110,
    sourceName: "EUR BCV",
    sourceUpdatedAt: "2026-05-06T00:00:00Z",
    fetchedAt: "2026-05-06T00:00:00Z",
  },
  {
    code: "eur_parallel",
    baseCurrency: "EUR",
    quoteCurrency: "VES",
    value: 160,
    sourceName: "EUR paralelo",
    sourceUpdatedAt: "2026-05-06T00:00:00Z",
    fetchedAt: "2026-05-06T00:00:00Z",
  },
];

describe("comparePaymentOptions", () => {
  it("ordena condiciones en VES por costo real", () => {
    const options: PaymentOptionInput[] = [
      { id: "bcv", label: "15000 Bs a BCV", amount: 15000, kind: "ves_bcv" },
      { id: "parallel", label: "12000 Bs a paralelo", amount: 12000, kind: "ves_parallel" },
    ];

    const result = comparePaymentOptions(options, rates, 140);

    expect(result[0].optionId).toBe("parallel");
    expect(result[0].isBest).toBe(true);
    expect(result[1].differenceVes).toBe(3000);
    expect(result[1].differencePercent).toBe(25);
  });

  it("convierte USD efectivo usando tasa manual", () => {
    const options: PaymentOptionInput[] = [
      { id: "cash", label: "20 USD efectivo", amount: 20, kind: "usd_cash" },
      { id: "bcv", label: "2500 Bs a BCV", amount: 2500, kind: "ves_bcv" },
    ];

    const result = comparePaymentOptions(options, rates, 140);

    expect(result[0].optionId).toBe("bcv");
    expect(result[1].equivalentVes).toBe(2800);
  });
});
