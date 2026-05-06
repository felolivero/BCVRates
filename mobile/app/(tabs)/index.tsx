import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import { comparePaymentOptions } from "../../src/domain/calculator";
import type { PaymentKind, PaymentOptionInput } from "../../src/domain/money";
import { parseDecimalInput } from "../../src/domain/numberInput";
import { seedRates } from "../../src/data/seedRates";

const kindOptions: { label: string; value: PaymentKind }[] = [
  { label: "USD divisas", value: "usd_divisas" },
  { label: "Bs a BCV", value: "ves_bcv" },
  { label: "Bs paralelo", value: "ves_parallel" },
  { label: "EUR", value: "eur" },
  { label: "USD efectivo", value: "usd_cash" },
];

function buildLabel(amount: number, kind: PaymentKind) {
  const kindLabel = kindOptions.find((option) => option.value === kind)?.label ?? kind;
  return `${amount} - ${kindLabel}`;
}

export default function CalculatorScreen() {
  const [amount, setAmount] = useState("20");
  const [kind, setKind] = useState<PaymentKind>("usd_divisas");
  const [cashRate, setCashRate] = useState("140");
  const [options, setOptions] = useState<PaymentOptionInput[]>([
    { id: "seed-usd", label: "20 - USD divisas", amount: 20, kind: "usd_divisas" },
    { id: "seed-ves", label: "2500 - Bs a BCV", amount: 2500, kind: "ves_bcv" },
  ]);
  const [message, setMessage] = useState("");

  const parsedCashRate = parseDecimalInput(cashRate);
  const comparison = useMemo(() => {
    if (!parsedCashRate.ok || options.length === 0) return [];
    return comparePaymentOptions(options, seedRates, parsedCashRate.value);
  }, [options, parsedCashRate]);

  const best = comparison[0];

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
      <View style={styles.panel}>
        <Text style={styles.label}>Monto</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} />

        <Text style={styles.label}>Como interpretar el monto</Text>
        <SegmentedControl options={kindOptions} value={kind} onChange={setKind} />

        <Text style={styles.label}>Tasa USD efectivo</Text>
        <TextInput value={cashRate} onChangeText={setCashRate} keyboardType="decimal-pad" style={styles.input} />

        <Pressable style={styles.primaryButton} onPress={addOption}>
          <Text style={styles.primaryButtonText}>Agregar condicion</Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      {best ? (
        <View style={styles.bestPanel}>
          <Text style={styles.bestEyebrow}>Mejor opcion ahora</Text>
          <Text style={styles.bestTitle}>{best.label}</Text>
          <Text style={styles.bestText}>
            Equivale a {best.equivalentVes.toFixed(2)} Bs o {best.equivalentUsd.toFixed(2)} USD.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Opciones comparadas</Text>
          <Pressable onPress={() => setOptions([])}>
            <Text style={styles.clearText}>Limpiar</Text>
          </Pressable>
        </View>
        {comparison.map((item) => (
          <View key={item.optionId} style={styles.resultRow}>
            <View style={styles.resultMain}>
              <Text style={styles.resultTitle}>{item.label}</Text>
              <Text style={styles.resultMeta}>
                {item.equivalentVes.toFixed(2)} Bs · {item.equivalentUsd.toFixed(2)} USD
              </Text>
            </View>
            <Text style={[styles.badge, item.isBest && styles.badgeBest]}>
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
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  message: {
    color: "#4b5563",
  },
  bestPanel: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  bestEyebrow: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bestTitle: {
    color: "#052e16",
    fontSize: 22,
    fontWeight: "900",
  },
  bestText: {
    color: "#166534",
    fontSize: 15,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  clearText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  resultRow: {
    alignItems: "center",
    borderTopColor: "#f3f4f6",
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
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  resultMeta: {
    color: "#6b7280",
    fontSize: 13,
  },
  badge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    color: "#374151",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeBest: {
    backgroundColor: "#14532d",
    color: "#ffffff",
  },
});
