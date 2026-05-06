import { describe, expect, it } from "vitest";
import { comparePaymentOptions, simulateSellScenario } from "../domain/calculator";
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
    code: "usdt_binance",
    baseCurrency: "USD",
    quoteCurrency: "VES",
    value: 150,
    sourceName: "USDT (Binance)",
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
];

describe("comparePaymentOptions", () => {
  it("ordena condiciones en VES por costo real", () => {
    const options: PaymentOptionInput[] = [
      { id: "bcv", label: "15000 Bs a BCV", amount: 15000, kind: "ves_bcv" },
      { id: "usdt", label: "12000 Bs a USDT", amount: 12000, kind: "ves_usdt" },
    ];

    const result = comparePaymentOptions(options, rates, 140);

    expect(result[0].optionId).toBe("usdt");
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

describe("simulateSellScenario", () => {
  it("usa tasa manual cuando se vende en Divisas", () => {
    const result = simulateSellScenario(20, "divisas", rates, 140, 2500);

    expect(result.usedRate).toBe(140);
    expect(result.receivedVes).toBe(2800);
    expect(result.differenceVsBestVes).toBe(300);
  });

  it("usa tasa usdt/binance cuando se vende USDT", () => {
    const result = simulateSellScenario(20, "usdt_binance", rates, 140, 2500);

    expect(result.usedRate).toBe(150);
    expect(result.receivedVes).toBe(3000);
    expect(result.differenceVsBestVes).toBe(500);
  });
});
