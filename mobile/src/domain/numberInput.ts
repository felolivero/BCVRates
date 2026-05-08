export type ParseDecimalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseDecimalInput(input: string): ParseDecimalResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "Ingresa un monto." };
  }

  if (trimmed.startsWith("-")) {
    return { ok: false, error: "El monto no puede ser negativo." };
  }

  const normalized = trimmed.replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { ok: false, error: "Ingresa un monto valido." };
  }

  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return { ok: false, error: "Ingresa un monto valido." };
  }

  return { ok: true, value };
}
