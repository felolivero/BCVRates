# Calculadora De Cambio Android Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal / Objetivo:** Construir la V1 de una app Android para consultar tasas, configurar tasa de efectivo y comparar condiciones de pago en Venezuela.

**Architecture / Arquitectura:** El repo tendra `mobile/` para la app Expo React Native, `supabase/` para schema, RLS y Edge Function, y `docs/` para documentacion. La app leera tasas desde Supabase, guardara cache local y usara logica pura testeable para conversiones y comparaciones.

**Tech Stack / Stack:** Expo + React Native + TypeScript, expo-router, Supabase JS, AsyncStorage, Vitest, Supabase SQL y Edge Functions.

---

## Estructura De Archivos

- `mobile/`: app Android Expo.
- `mobile/src/domain/money.ts`: tipos de moneda, tasas, opciones de pago y resultados.
- `mobile/src/domain/numberInput.ts`: parseo de montos con coma o punto decimal.
- `mobile/src/domain/calculator.ts`: conversiones y ranking de opciones.
- `mobile/src/services/rates/types.ts`: tipos de tasas que vienen de Supabase.
- `mobile/src/services/rates/ratesRepository.ts`: lectura desde Supabase y fallback a cache local.
- `mobile/src/services/rates/localRatesCache.ts`: persistencia de tasas y tasa manual de efectivo.
- `mobile/src/services/supabase/client.ts`: cliente Supabase publico.
- `mobile/src/app/(tabs)/index.tsx`: pantalla Calculadora.
- `mobile/src/app/(tabs)/tasas.tsx`: pantalla Tasas.
- `mobile/src/app/(tabs)/ajustes.tsx`: pantalla Ajustes.
- `mobile/src/components/`: componentes UI pequenos y reutilizables.
- `mobile/src/__tests__/`: pruebas unitarias.
- `supabase/migrations/0001_rates.sql`: tablas, RLS y policies.
- `supabase/functions/refresh-rates/index.ts`: Edge Function para refrescar tasas desde DolarApi.
- `supabase/functions/refresh-rates/deno.json`: config de imports para la funcion.

## Datos Que Se Pediran Al Usuario

No se necesitan datos de Supabase para las primeras tareas de app y dominio.

Pedir al usuario estos datos antes de ejecutar la tarea de conexion real con Supabase:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Project ref de Supabase para deploy y pruebas.
- Confirmacion de si quiere que yo cree las tablas/policies directamente o que deje SQL listo para ejecutar.

---

### Task 1: Scaffold Expo App

**Files:**
- Create: `mobile/`
- Create: `mobile/.env.example`
- Modify: `README.md`

- [ ] **Step 1: Crear proyecto Expo**

Run:

```powershell
npx create-expo-app@latest mobile --template default
```

Expected: crea `mobile/package.json`, `mobile/app.json` y estructura base Expo.

- [ ] **Step 2: Instalar dependencias de runtime**

Run:

```powershell
Set-Location mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage expo-router react-native-safe-area-context react-native-screens
```

Expected: dependencias instaladas sin errores.

- [ ] **Step 3: Instalar dependencias de pruebas**

Run:

```powershell
npm install -D vitest typescript
```

Expected: `vitest` disponible para pruebas de dominio.

- [ ] **Step 4: Crear variables de entorno de ejemplo**

Create `mobile/.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

- [ ] **Step 5: Ajustar scripts de pruebas**

Modify `mobile/package.json` scripts:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: Commit**

Run:

```powershell
git add mobile README.md
git commit -m "chore: scaffold Expo mobile app"
```

Expected: commit creado.

---

### Task 2: Domain Types And Number Parsing

**Files:**
- Create: `mobile/src/domain/money.ts`
- Create: `mobile/src/domain/numberInput.ts`
- Test: `mobile/src/__tests__/numberInput.test.ts`

- [ ] **Step 1: Escribir pruebas fallidas de parseo**

Create `mobile/src/__tests__/numberInput.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseDecimalInput } from "../domain/numberInput";

describe("parseDecimalInput", () => {
  it("accepts dot decimals", () => {
    expect(parseDecimalInput("20.50")).toEqual({ ok: true, value: 20.5 });
  });

  it("accepts comma decimals", () => {
    expect(parseDecimalInput("20,50")).toEqual({ ok: true, value: 20.5 });
  });

  it("rejects negative values", () => {
    expect(parseDecimalInput("-1")).toEqual({ ok: false, error: "El monto no puede ser negativo." });
  });

  it("rejects empty values", () => {
    expect(parseDecimalInput("")).toEqual({ ok: false, error: "Ingresa un monto." });
  });
});
```

- [ ] **Step 2: Ejecutar prueba y confirmar fallo**

Run:

```powershell
npm test -- src/__tests__/numberInput.test.ts
```

Expected: FAIL porque `numberInput` no existe.

- [ ] **Step 3: Crear tipos base**

Create `mobile/src/domain/money.ts`:

```ts
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
```

- [ ] **Step 4: Implementar parseo**

Create `mobile/src/domain/numberInput.ts`:

```ts
export type ParseDecimalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseDecimalInput(input: string): ParseDecimalResult {
  const normalized = input.trim().replace(",", ".");

  if (normalized.length === 0) {
    return { ok: false, error: "Ingresa un monto." };
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { ok: false, error: "Ingresa un monto valido." };
  }

  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return { ok: false, error: "Ingresa un monto valido." };
  }

  if (value < 0) {
    return { ok: false, error: "El monto no puede ser negativo." };
  }

  return { ok: true, value };
}
```

- [ ] **Step 5: Ejecutar pruebas**

Run:

```powershell
npm test -- src/__tests__/numberInput.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add mobile/src/domain mobile/src/__tests__/numberInput.test.ts
git commit -m "feat: add money types and amount parsing"
```

---

### Task 3: Calculator Engine

**Files:**
- Create: `mobile/src/domain/calculator.ts`
- Test: `mobile/src/__tests__/calculator.test.ts`

- [ ] **Step 1: Escribir pruebas fallidas de comparacion**

Create `mobile/src/__tests__/calculator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { comparePaymentOptions } from "../domain/calculator";
import type { ExchangeRate, PaymentOptionInput } from "../domain/money";

const rates: ExchangeRate[] = [
  { code: "usd_bcv", baseCurrency: "USD", quoteCurrency: "VES", value: 100, sourceName: "BCV", sourceUpdatedAt: "2026-05-06T00:00:00Z", fetchedAt: "2026-05-06T00:00:00Z" },
  { code: "usd_parallel", baseCurrency: "USD", quoteCurrency: "VES", value: 150, sourceName: "Paralelo", sourceUpdatedAt: "2026-05-06T00:00:00Z", fetchedAt: "2026-05-06T00:00:00Z" },
  { code: "eur_bcv", baseCurrency: "EUR", quoteCurrency: "VES", value: 110, sourceName: "EUR", sourceUpdatedAt: "2026-05-06T00:00:00Z", fetchedAt: "2026-05-06T00:00:00Z" },
];

describe("comparePaymentOptions", () => {
  it("ranks VES conditions by real cost", () => {
    const options: PaymentOptionInput[] = [
      { id: "bcv", label: "15000 Bs a BCV", amount: 15000, kind: "ves_bcv" },
      { id: "parallel", label: "12000 Bs a paralelo", amount: 12000, kind: "ves_parallel" },
    ];

    const result = comparePaymentOptions(options, rates, 140);

    expect(result[0].optionId).toBe("parallel");
    expect(result[0].isBest).toBe(true);
    expect(result[1].differenceVes).toBe(3000);
  });

  it("converts USD cash using manual cash rate", () => {
    const options: PaymentOptionInput[] = [
      { id: "cash", label: "20 USD efectivo", amount: 20, kind: "usd_cash" },
      { id: "bcv", label: "2500 Bs a BCV", amount: 2500, kind: "ves_bcv" },
    ];

    const result = comparePaymentOptions(options, rates, 140);

    expect(result[0].optionId).toBe("bcv");
    expect(result[1].equivalentVes).toBe(2800);
  });
});
```

- [ ] **Step 2: Ejecutar prueba y confirmar fallo**

Run:

```powershell
npm test -- src/__tests__/calculator.test.ts
```

Expected: FAIL porque `calculator` no existe.

- [ ] **Step 3: Implementar calculadora**

Create `mobile/src/domain/calculator.ts`:

```ts
import type { ExchangeRate, PaymentComparisonResult, PaymentKind, PaymentOptionInput, RateCode } from "./money";

function rateValue(rates: ExchangeRate[], code: RateCode): number {
  const rate = rates.find((item) => item.code === code);
  if (!rate || rate.value <= 0) {
    throw new Error(`Falta la tasa ${code}.`);
  }
  return rate.value;
}

function toVes(option: PaymentOptionInput, rates: ExchangeRate[], cashUsdRate: number): number {
  const usdBcv = rateValue(rates, "usd_bcv");
  const usdParallel = rateValue(rates, "usd_parallel");

  const handlers: Record<PaymentKind, () => number> = {
    usd_divisas: () => option.amount * usdParallel,
    ves_bcv: () => option.amount,
    ves_parallel: () => option.amount,
    eur: () => option.amount * rateValue(rates, "eur_bcv"),
    usd_cash: () => option.amount * cashUsdRate,
  };

  const ves = handlers[option.kind]();
  return Number(ves.toFixed(2));
}

export function comparePaymentOptions(
  options: PaymentOptionInput[],
  rates: ExchangeRate[],
  cashUsdRate: number,
): PaymentComparisonResult[] {
  if (options.length === 0) return [];
  if (cashUsdRate <= 0) throw new Error("La tasa de efectivo debe ser mayor a cero.");

  const usdParallel = rateValue(rates, "usd_parallel");
  const priced = options.map((option) => {
    const equivalentVes = toVes(option, rates, cashUsdRate);
    return {
      option,
      equivalentVes,
      equivalentUsd: Number((equivalentVes / usdParallel).toFixed(2)),
    };
  });

  const bestCost = Math.min(...priced.map((item) => item.equivalentVes));

  return priced
    .map((item) => ({
      optionId: item.option.id,
      label: item.option.label,
      equivalentVes: item.equivalentVes,
      equivalentUsd: item.equivalentUsd,
      differenceVes: Number((item.equivalentVes - bestCost).toFixed(2)),
      differencePercent: bestCost === 0 ? 0 : Number((((item.equivalentVes - bestCost) / bestCost) * 100).toFixed(2)),
      isBest: item.equivalentVes === bestCost,
    }))
    .sort((a, b) => a.equivalentVes - b.equivalentVes);
}
```

- [ ] **Step 4: Ejecutar pruebas**

Run:

```powershell
npm test -- src/__tests__/calculator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add mobile/src/domain/calculator.ts mobile/src/__tests__/calculator.test.ts
git commit -m "feat: add payment comparison engine"
```

---

### Task 4: Supabase Schema, RLS And Edge Function

**Files:**
- Create: `supabase/migrations/0001_rates.sql`
- Create: `supabase/functions/refresh-rates/index.ts`
- Create: `supabase/functions/refresh-rates/deno.json`

- [ ] **Step 1: Pedir datos de Supabase al usuario**

Ask for:

```text
Necesito estos datos para conectar Supabase:
- Project ref
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- Confirmacion para crear tablas/policies o dejar SQL listo
```

Expected: no continuar con comandos Supabase hasta recibir esos datos.

- [ ] **Step 2: Crear migracion SQL**

Create `supabase/migrations/0001_rates.sql`:

```sql
create table if not exists public.exchange_rates (
  code text primary key,
  base_currency text not null check (base_currency in ('USD', 'EUR')),
  quote_currency text not null default 'VES' check (quote_currency = 'VES'),
  value numeric(14, 4) not null check (value > 0),
  source text not null default 'dolarapi',
  source_name text not null,
  source_updated_at timestamptz not null,
  fetched_at timestamptz not null default now()
);

create table if not exists public.exchange_rate_history (
  id bigint generated always as identity primary key,
  code text not null,
  base_currency text not null check (base_currency in ('USD', 'EUR')),
  quote_currency text not null default 'VES' check (quote_currency = 'VES'),
  value numeric(14, 4) not null check (value > 0),
  source text not null default 'dolarapi',
  source_name text not null,
  source_updated_at timestamptz not null,
  fetched_at timestamptz not null default now()
);

alter table public.exchange_rates enable row level security;
alter table public.exchange_rate_history enable row level security;

create policy "exchange_rates_public_read"
on public.exchange_rates
for select
to anon, authenticated
using (true);

create policy "exchange_rate_history_public_read"
on public.exchange_rate_history
for select
to anon, authenticated
using (true);
```

- [ ] **Step 3: Crear Edge Function**

Create `supabase/functions/refresh-rates/index.ts`:

```ts
import { createClient } from "npm:@supabase/supabase-js@2";

type DolarApiRate = {
  fuente: string;
  nombre: string;
  moneda?: string;
  compra?: number;
  venta?: number;
  promedio: number;
  fechaActualizacion: string;
};

type RateUpsert = {
  code: string;
  base_currency: "USD" | "EUR";
  quote_currency: "VES";
  value: number;
  source: string;
  source_name: string;
  source_updated_at: string;
  fetched_at: string;
};

const endpoints = [
  { code: "usd_bcv", baseCurrency: "USD" as const, url: "https://ve.dolarapi.com/v1/dolares/oficial" },
  { code: "usd_parallel", baseCurrency: "USD" as const, url: "https://ve.dolarapi.com/v1/dolares/paralelo" },
];

async function fetchUsdRate(item: typeof endpoints[number]): Promise<RateUpsert> {
  const response = await fetch(item.url);
  if (!response.ok) throw new Error(`DolarApi fallo: ${item.url}`);
  const data = (await response.json()) as DolarApiRate;
  return {
    code: item.code,
    base_currency: item.baseCurrency,
    quote_currency: "VES",
    value: data.promedio,
    source: "dolarapi",
    source_name: data.nombre,
    source_updated_at: data.fechaActualizacion,
    fetched_at: new Date().toISOString(),
  };
}

function mapEuroRate(data: DolarApiRate, code: "eur_bcv" | "eur_parallel"): RateUpsert {
  return {
    code,
    base_currency: "EUR",
    quote_currency: "VES",
    value: data.promedio,
    source: "dolarapi",
    source_name: data.nombre,
    source_updated_at: data.fechaActualizacion,
    fetched_at: new Date().toISOString(),
  };
}

async function fetchEuroRates(): Promise<RateUpsert[]> {
  const response = await fetch("https://ve.dolarapi.com/v1/euros");
  if (!response.ok) throw new Error("DolarApi fallo: https://ve.dolarapi.com/v1/euros");

  const data = (await response.json()) as DolarApiRate[];
  const official = data.find((item) => item.nombre.toLowerCase().includes("oficial"));
  const parallel = data.find((item) => item.nombre.toLowerCase().includes("paralelo"));

  if (!official || !parallel) {
    throw new Error("No se encontraron euro oficial y euro paralelo en DolarApi.");
  }

  return [mapEuroRate(official, "eur_bcv"), mapEuroRate(parallel, "eur_parallel")];
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Faltan variables de Supabase." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const usdRates = await Promise.all(endpoints.map(fetchUsdRate));
  const euroRates = await fetchEuroRates();
  const rates = [...usdRates, ...euroRates];

  const { error: upsertError } = await supabase.from("exchange_rates").upsert(rates, { onConflict: "code" });
  if (upsertError) return Response.json({ error: upsertError.message }, { status: 500 });

  const { error: historyError } = await supabase.from("exchange_rate_history").insert(rates);
  if (historyError) return Response.json({ error: historyError.message }, { status: 500 });

  return Response.json({ ok: true, rates });
});
```

- [ ] **Step 4: Crear config Deno**

Create `supabase/functions/refresh-rates/deno.json`:

```json
{
  "imports": {
    "@supabase/supabase-js": "npm:@supabase/supabase-js@2"
  }
}
```

- [ ] **Step 5: Verificar migracion localmente**

Run:

```powershell
supabase --help
```

Expected: CLI disponible o indicar al usuario que se necesita instalar/configurar Supabase CLI antes de aplicar migraciones.

- [ ] **Step 6: Commit**

Run:

```powershell
git add supabase
git commit -m "feat: add Supabase rates schema and refresh function"
```

---

### Task 5: Rates Repository And Local Cache

**Files:**
- Create: `mobile/src/services/supabase/client.ts`
- Create: `mobile/src/services/rates/types.ts`
- Create: `mobile/src/services/rates/localRatesCache.ts`
- Create: `mobile/src/services/rates/ratesRepository.ts`
- Test: `mobile/src/__tests__/localRatesCache.test.ts`

- [ ] **Step 1: Crear cliente Supabase**

Create `mobile/src/services/supabase/client.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan variables publicas de Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: Crear tipos de tasas**

Create `mobile/src/services/rates/types.ts`:

```ts
import type { ExchangeRate } from "../../domain/money";

export type ExchangeRateRow = {
  code: string;
  base_currency: "USD" | "EUR";
  quote_currency: "VES";
  value: number;
  source: string;
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
```

- [ ] **Step 3: Implementar cache local**

Create `mobile/src/services/rates/localRatesCache.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExchangeRate } from "../../domain/money";

const RATES_KEY = "appcambiobcv:rates";
const CASH_RATE_KEY = "appcambiobcv:cash-usd-rate";

export async function saveRatesCache(rates: ExchangeRate[]): Promise<void> {
  await AsyncStorage.setItem(RATES_KEY, JSON.stringify(rates));
}

export async function loadRatesCache(): Promise<ExchangeRate[]> {
  const raw = await AsyncStorage.getItem(RATES_KEY);
  return raw ? (JSON.parse(raw) as ExchangeRate[]) : [];
}

export async function saveCashUsdRate(value: number): Promise<void> {
  await AsyncStorage.setItem(CASH_RATE_KEY, JSON.stringify({ value, updatedAt: new Date().toISOString() }));
}

export async function loadCashUsdRate(): Promise<{ value: number; updatedAt: string } | null> {
  const raw = await AsyncStorage.getItem(CASH_RATE_KEY);
  return raw ? (JSON.parse(raw) as { value: number; updatedAt: string }) : null;
}
```

- [ ] **Step 4: Implementar repositorio**

Create `mobile/src/services/rates/ratesRepository.ts`:

```ts
import type { ExchangeRate } from "../../domain/money";
import { supabase } from "../supabase/client";
import { loadRatesCache, saveRatesCache } from "./localRatesCache";
import { mapRateRow, type ExchangeRateRow } from "./types";

export type RatesLoadResult = {
  rates: ExchangeRate[];
  source: "supabase" | "cache";
  error?: string;
};

export async function loadRates(): Promise<RatesLoadResult> {
  const cached = await loadRatesCache();
  const { data, error } = await supabase.from("exchange_rates").select("*").order("code");

  if (error || !data) {
    return { rates: cached, source: "cache", error: error?.message ?? "No se pudieron cargar tasas." };
  }

  const rates = (data as ExchangeRateRow[]).map(mapRateRow);
  await saveRatesCache(rates);
  return { rates, source: "supabase" };
}

export async function refreshRates(): Promise<RatesLoadResult> {
  const { error } = await supabase.functions.invoke("refresh-rates");
  if (error) {
    const cached = await loadRatesCache();
    return { rates: cached, source: "cache", error: error.message };
  }

  return loadRates();
}
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add mobile/src/services
git commit -m "feat: add rates repository and local cache"
```

---

### Task 6: App Navigation And Screens

**Files:**
- Create: `mobile/src/app/_layout.tsx`
- Create: `mobile/src/app/(tabs)/_layout.tsx`
- Create: `mobile/src/app/(tabs)/index.tsx`
- Create: `mobile/src/app/(tabs)/tasas.tsx`
- Create: `mobile/src/app/(tabs)/ajustes.tsx`
- Create: `mobile/src/components/RateCard.tsx`

- [ ] **Step 1: Configurar layout raiz**

Create `mobile/src/app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Configurar tabs**

Create `mobile/src/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen name="index" options={{ title: "Calculadora" }} />
      <Tabs.Screen name="tasas" options={{ title: "Tasas" }} />
      <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Crear tarjeta de tasa**

Create `mobile/src/components/RateCard.tsx`:

```tsx
import { Text, View } from "react-native";

type Props = {
  title: string;
  value: number;
  updatedAt: string;
};

export function RateCard({ title, value, updatedAt }: Props) {
  return (
    <View style={{ padding: 16, borderRadius: 8, backgroundColor: "#ffffff", marginBottom: 12 }}>
      <Text style={{ fontSize: 14, color: "#4b5563" }}>{title}</Text>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>{value.toFixed(2)} Bs</Text>
      <Text style={{ fontSize: 12, color: "#6b7280" }}>Actualizado: {new Date(updatedAt).toLocaleString("es-VE")}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Crear pantalla Calculadora inicial**

Create `mobile/src/app/(tabs)/index.tsx`:

```tsx
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { parseDecimalInput } from "../../domain/numberInput";

export default function CalculatorScreen() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("Ingresa un monto para comenzar.");

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: "#f3f4f6" }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Calculadora</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="Ej: 20 USD o 15000 Bs"
        style={{ backgroundColor: "#fff", borderRadius: 8, padding: 14, fontSize: 18 }}
      />
      <Button
        title="Validar monto"
        onPress={() => {
          const parsed = parseDecimalInput(amount.replace(/[^\d,.]/g, ""));
          setMessage(parsed.ok ? `Monto detectado: ${parsed.value}` : parsed.error);
        }}
      />
      <Text>{message}</Text>
    </View>
  );
}
```

- [ ] **Step 5: Crear pantalla Tasas**

Create `mobile/src/app/(tabs)/tasas.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { RateCard } from "../../components/RateCard";
import type { ExchangeRate } from "../../domain/money";
import { loadRates, refreshRates } from "../../services/rates/ratesRepository";

export default function RatesScreen() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [status, setStatus] = useState("Cargando tasas...");

  async function load() {
    const result = await loadRates();
    setRates(result.rates);
    setStatus(result.error ? `Usando ${result.source}: ${result.error}` : `Fuente: ${result.source}`);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f4f6" }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 12 }}>Tasas</Text>
      <Text style={{ marginBottom: 12 }}>{status}</Text>
      <Button
        title="Refrescar"
        onPress={async () => {
          const result = await refreshRates();
          setRates(result.rates);
          setStatus(result.error ? `Usando ${result.source}: ${result.error}` : "Tasas actualizadas.");
        }}
      />
      <View style={{ height: 16 }} />
      {rates.map((rate) => (
        <RateCard key={rate.code} title={rate.sourceName} value={rate.value} updatedAt={rate.sourceUpdatedAt} />
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 6: Crear pantalla Ajustes inicial**

Create `mobile/src/app/(tabs)/ajustes.tsx`:

```tsx
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { parseDecimalInput } from "../../domain/numberInput";
import { saveCashUsdRate } from "../../services/rates/localRatesCache";

export default function SettingsScreen() {
  const [cashRate, setCashRate] = useState("");
  const [message, setMessage] = useState("Configura tu tasa de USD efectivo.");

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: "#f3f4f6" }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Ajustes</Text>
      <TextInput
        value={cashRate}
        onChangeText={setCashRate}
        keyboardType="decimal-pad"
        placeholder="Ej: 265"
        style={{ backgroundColor: "#fff", borderRadius: 8, padding: 14, fontSize: 18 }}
      />
      <Button
        title="Guardar tasa efectivo"
        onPress={async () => {
          const parsed = parseDecimalInput(cashRate);
          if (!parsed.ok) return setMessage(parsed.error);
          await saveCashUsdRate(parsed.value);
          setMessage("Tasa de efectivo guardada.");
        }}
      />
      <Text>{message}</Text>
    </View>
  );
}
```

- [ ] **Step 7: Commit**

Run:

```powershell
git add mobile/src/app mobile/src/components
git commit -m "feat: add calculator rates and settings screens"
```

---

### Task 7: Android Build Setup And Verification

**Files:**
- Modify: `mobile/app.json`
- Modify: `mobile/package.json`

- [ ] **Step 1: Configurar metadata Android**

Modify `mobile/app.json`:

```json
{
  "expo": {
    "name": "Cambio BCV",
    "slug": "cambio-bcv",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "cambiobcv",
    "android": {
      "package": "com.felolivero.cambiobcv",
      "versionCode": 1
    },
    "plugins": ["expo-router"]
  }
}
```

- [ ] **Step 2: Ejecutar pruebas unitarias**

Run:

```powershell
Set-Location mobile
npm test
```

Expected: todas las pruebas pasan.

- [ ] **Step 3: Ejecutar lint o TypeScript check**

Run:

```powershell
npx tsc --noEmit
```

Expected: sin errores de tipos.

- [ ] **Step 4: Probar app en dev server**

Run:

```powershell
npm run start
```

Expected: Expo inicia y muestra QR/opciones de Android.

- [ ] **Step 5: Preparar build Android**

Run:

```powershell
npx eas build:configure
npx eas build -p android --profile preview
```

Expected: EAS solicita login/configuracion si no existe. Si el usuario no quiere usar EAS todavia, documentar el bloqueo y dejar app funcional en dev.

- [ ] **Step 6: Commit**

Run:

```powershell
git add mobile/app.json mobile/package.json
git commit -m "chore: configure Android build"
```

---

## Verificacion Final

- [ ] `npm test` dentro de `mobile/` pasa.
- [ ] `npx tsc --noEmit` dentro de `mobile/` pasa.
- [ ] La pantalla Calculadora abre.
- [ ] La pantalla Tasas abre y muestra cache/error de forma clara si Supabase no esta configurado.
- [ ] La pantalla Ajustes guarda tasa manual de efectivo.
- [ ] Supabase tiene RLS activado en `exchange_rates` y `exchange_rate_history`.
- [ ] La Edge Function `refresh-rates` no expone `service_role` en la app.
- [ ] El README indica como configurar `.env`.

## Notas De Riesgo

- Antes de implementar Supabase, verificar la documentacion actual de Supabase Edge Functions y RLS.
- Antes de generar APK/AAB, verificar si EAS esta autenticado en la maquina.
- El endpoint de EUR de DolarApi debe probarse durante Task 4 para confirmar la forma exacta de respuesta antes de mapearlo en produccion.
