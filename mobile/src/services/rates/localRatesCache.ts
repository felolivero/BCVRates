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
