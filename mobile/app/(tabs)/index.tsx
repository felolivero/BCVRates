import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import { comparePaymentOptions, simulateSellScenario } from "../../src/domain/calculator";
import type { PaymentKind, PaymentOptionInput, SellInstrument } from "../../src/domain/money";
import { parseDecimalInput } from "../../src/domain/numberInput";
import { useRates } from "../../src/hooks/useRates";
import { appColors } from "../../src/theme/colors";

const kindOptions: { label: string; value: PaymentKind }[] = [
  { label: "Divisas", value: "usd_divisas" },
  { label: "Bs a BCV", value: "ves_bcv" },
  { label: "Bs USDT (Binance)", value: "ves_parallel" },
  { label: "EUR", value: "eur" },
  { label: "Divisas (tasa manual)", value: "usd_cash" },
];

const sellInstrumentOptions: { label: string; value: SellInstrument }[] = [
  { label: "Divisas", value: "divisas" },
  { label: "USDT (Binance)", value: "usdt_binance" },
];

function buildLabel(amount: number, kind: PaymentKind) {
  const kindLabel = kindOptions.find((option) => option.value === kind)?.label ?? kind;
  return `${amount} - ${kindLabel}`;
}

export default function CalculatorScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];
  const [amount, setAmount] = useState("20");
  const [kind, setKind] = useState<PaymentKind>("usd_divisas");
  const [cashRate, setCashRate] = useState("140");
  const [sellUsdAmount, setSellUsdAmount] = useState("20");
  const [sellInstrument, setSellInstrument] = useState<SellInstrument>("divisas");
  const [options, setOptions] = useState<PaymentOptionInput[]>([
    { id: "seed-usd", label: "20 - Divisas", amount: 20, kind: "usd_divisas" },
    { id: "seed-ves", label: "2500 - Bs a BCV", amount: 2500, kind: "ves_bcv" },
  ]);
  const [message, setMessage] = useState("");
  const { rates, source, message: ratesMessage } = useRates();

  const parsedCashRate = parseDecimalInput(cashRate);
  const comparison = useMemo(() => {
    if (!parsedCashRate.ok || options.length === 0) return [];
    return comparePaymentOptions(options, rates, parsedCashRate.value);
  }, [options, parsedCashRate, rates]);

  const best = comparison[0];
  const parsedSellUsdAmount = parseDecimalInput(sellUsdAmount);
  const sellScenario = useMemo(() => {
    if (!best || !parsedCashRate.ok || !parsedSellUsdAmount.ok) return null;
    return simulateSellScenario(
      parsedSellUsdAmount.value,
      sellInstrument,
      rates,
      parsedCashRate.value,
      best.equivalentVes,
    );
  }, [best, parsedCashRate, parsedSellUsdAmount, sellInstrument, rates]);

  function addOption() {
    const parsedAmount = parseDecimalInput(amount);
    if (!parsedAmount.ok) {
      setMessage(parsedAmount.error);
      return;
    }

    if (!parsedCashRate.ok) {
      setMessage(parsedCashRate.error);
      return;
    }

    const option: PaymentOptionInput = {
      id: String(Date.now()),
      label: buildLabel(parsedAmount.value, kind),
      amount: parsedAmount.value,
      kind,
    };

    setOptions((current) => [...current, option]);
    setMessage("Opcion agregada.");
  }

  return (
    <AlphaShell
      title="Calculadora"
      subtitle="Agrega las condiciones que te dio el comercio y compara cual forma de pago conviene mas.">
      <View style={[styles.sourcePanel, { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder }]}>
        <Text style={[styles.sourceTitle, { color: colors.infoText }]}>
          Tasas: {source === "supabase" ? "Supabase" : source === "cache" ? "Cache" : "Alpha"}
        </Text>
        <Text style={[styles.sourceText, { color: colors.infoText }]}>{ratesMessage}</Text>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Monto</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={[
            styles.input,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.strongBorder, color: colors.text },
          ]}
          placeholderTextColor={colors.softText}
        />

        <Text style={[styles.label, { color: colors.mutedText }]}>Como interpretar el monto</Text>
        <SegmentedControl options={kindOptions} value={kind} onChange={setKind} />

        <Text style={[styles.label, { color: colors.mutedText }]}>Tasa manual Divisas</Text>
        <TextInput
          value={cashRate}
          onChangeText={setCashRate}
          keyboardType="decimal-pad"
          style={[
            styles.input,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.strongBorder, color: colors.text },
          ]}
          placeholderTextColor={colors.softText}
        />

        <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={addOption}>
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>Agregar condicion</Text>
        </Pressable>
        {message ? <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text> : null}
      </View>

      {best ? (
        <View style={[styles.bestPanel, { backgroundColor: colors.successSurface, borderColor: colors.successBorder }]}>
          <Text style={[styles.bestEyebrow, { color: colors.successText }]}>Mejor opcion ahora</Text>
          <Text style={[styles.bestTitle, { color: colors.successText }]}>{best.label}</Text>
          <Text style={[styles.bestText, { color: colors.successText }]}>
            Equivale a {best.equivalentVes.toFixed(2)} Bs o {best.equivalentUsd.toFixed(2)} USD.
          </Text>
        </View>
      ) : null}

      {best ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Averigua cuánto sería si vendes tus divisas o USDT
          </Text>
          <Text style={[styles.label, { color: colors.mutedText }]}>Qué vas a vender</Text>
          <SegmentedControl options={sellInstrumentOptions} value={sellInstrument} onChange={setSellInstrument} />
          <Text style={[styles.label, { color: colors.mutedText }]}>Monto en USD</Text>
          <TextInput
            value={sellUsdAmount}
            onChangeText={setSellUsdAmount}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.strongBorder, color: colors.text },
            ]}
            placeholderTextColor={colors.softText}
          />
          {sellScenario ? (
            <View style={[styles.sourcePanel, { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder }]}>
              <Text style={[styles.sourceTitle, { color: colors.infoText }]}>Resultado simulado</Text>
              <Text style={[styles.sourceText, { color: colors.infoText }]}>
                Recibirías aprox: {sellScenario.receivedVes.toFixed(2)} Bs.
              </Text>
              <Text style={[styles.sourceText, { color: colors.infoText }]}>
                Tasa usada: {sellScenario.usedRate.toFixed(2)} Bs/USD.
              </Text>
              <Text style={[styles.sourceText, { color: colors.infoText }]}>
                Diferencia vs mejor opción: {sellScenario.differenceVsBestVes.toFixed(2)} Bs.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Opciones comparadas</Text>
          <Pressable onPress={() => setOptions([])}>
            <Text style={[styles.clearText, { color: colors.dangerText }]}>Limpiar</Text>
          </Pressable>
        </View>
        {comparison.map((item) => (
          <View key={item.optionId} style={[styles.resultRow, { borderTopColor: colors.border }]}>
            <View style={styles.resultMain}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.resultMeta, { color: colors.softText }]}>
                {item.equivalentVes.toFixed(2)} Bs · {item.equivalentUsd.toFixed(2)} USD
              </Text>
            </View>
            <Text
              style={[
                styles.badge,
                { backgroundColor: colors.surfaceMuted, color: colors.mutedText },
                item.isBest && { backgroundColor: colors.primary, color: colors.primaryText },
              ]}>
              {item.isBest ? "Mejor" : `+${item.differencePercent.toFixed(2)}%`}
            </Text>
          </View>
        ))}
      </View>
    </AlphaShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  message: {
  },
  bestPanel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  bestEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bestTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  bestText: {
    fontSize: 15,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  clearText: {
    fontWeight: "700",
  },
  resultRow: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 12,
  },
  resultMain: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  resultMeta: {
    fontSize: 13,
  },
  badge: {
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeBest: {
  },
  sourcePanel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sourceText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
