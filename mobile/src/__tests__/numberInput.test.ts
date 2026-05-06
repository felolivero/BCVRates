import { describe, expect, it } from "vitest";
import { parseDecimalInput } from "../domain/numberInput";

describe("parseDecimalInput", () => {
  it("acepta decimales con punto", () => {
    expect(parseDecimalInput("20.50")).toEqual({ ok: true, value: 20.5 });
  });

  it("acepta decimales con coma", () => {
    expect(parseDecimalInput("20,50")).toEqual({ ok: true, value: 20.5 });
  });

  it("rechaza valores negativos", () => {
    expect(parseDecimalInput("-1")).toEqual({
      ok: false,
      error: "El monto no puede ser negativo.",
    });
  });

  it("rechaza valores vacios", () => {
    expect(parseDecimalInput("")).toEqual({ ok: false, error: "Ingresa un monto." });
  });
});
