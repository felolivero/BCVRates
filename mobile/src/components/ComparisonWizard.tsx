import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, useColorScheme, View } from "react-native";

import { comparePaymentOptions, simulateSellScenario } from "../domain/calculator";
import type {
  ExchangeRate,
  PaymentComparisonResult,
  PaymentKind,
  PaymentOptionInput,
  SellInstrument,
} from "../domain/money";
import { parseDecimalInput } from "../domain/numberInput";
import { appColors } from "../theme/colors";
import { SegmentedControl } from "./SegmentedControl";

type OfferKey = "divisas" | "ves_bcv" | "ves_usdt" | "eur";

type OfferConfig = {
  key: OfferKey;
  title: string;
  description: string;
  placeholder: string;
  paymentKind: PaymentKind;
  defaultValue: string;
};

type Props = {
  rates: ExchangeRate[];
};

const offerConfigs: OfferConfig[] = [
  {
    key: "divisas",
    title: "Divisas",
    description: "Precio si pagas en USD efectivo.",
    placeholder: "20",
    paymentKind: "usd_cash",
    defaultValue: "20",
  },
  {
    key: "ves_bcv",
    title: "Bolivares BCV",
    description: "Monto final en Bs a tasa oficial.",
    placeholder: "15000",
    paymentKind: "ves_bcv",
    defaultValue: "15000",
  },
  {
    key: "ves_usdt",
    title: "Bolivares USDT",
    description: "Monto final en Bs a referencia Binance/paralela.",
    placeholder: "17000",
    paymentKind: "ves_parallel",
    defaultValue: "17000",
  },
  {
    key: "eur",
    title: "Euros",
    description: "Precio si pagas en EUR.",
    placeholder: "18",
    paymentKind: "eur",
    defaultValue: "",
  },
];

const sellInstrumentOptions: { label: string; value: SellInstrument }[] = [
  { label: "Divisas", value: "divisas" },
  { label: "USDT (Binance)", value: "usdt_binance" },
];

const initialEnabled: Record<OfferKey, boolean> = {
  divisas: true,
  ves_bcv: true,
  ves_usdt: true,
  eur: false,
};

const initialAmounts = offerConfigs.reduce<Record<OfferKey, string>>(
  (current, item) => ({ ...current, [item.key]: item.defaultValue }),
  {
    divisas: "",
    ves_bcv: "",
    ves_usdt: "",
    eur: "",
  },
);

function buildPaymentLabel(config: OfferConfig, amount: number) {
  if (config.key === "divisas") return `${amount} USD en divisas`;
  if (config.key === "ves_bcv") return `${amount} Bs a BCV`;
  if (config.key === "ves_usdt") return `${amount} Bs a USDT`;
  return `${amount} EUR`;
}

function formatVes(value: number) {
  return `${value.toLocaleString("es-VE", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} Bs`;
}

function formatUsd(value: number) {
  return `${value.toLocaleString("es-VE", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} USD`;
}

function getRankLabel(item: PaymentComparisonResult, index: number, total: number) {
  if (item.isBest) return "Mejor";
  if (index === total - 1) return "Mas caro";
  return "Intermedio";
}

export function ComparisonWizard({ rates }: Props) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];
  const [enabled, setEnabled] = useState(initialEnabled);
  const [amounts, setAmounts] = useState(initialAmounts);
  const [cashRate, setCashRate] = useState("140");
  const [sellInstrument, setSellInstrument] = useState<SellInstrument>("divisas");
  const [sellUsdAmount, setSellUsdAmount] = useState("");

  const parsedCashRate = parseDecimalInput(cashRate);

  const selectedConfigs = offerConfigs.filter((config) => enabled[config.key]);
  const parsedOptions = useMemo(() => {
    const errors: string[] = [];
    const options: PaymentOptionInput[] = [];

    selectedConfigs.forEach((config) => {
      const rawAmount = amounts[config.key];
      if (!rawAmount.trim()) return;

      const parsed = parseDecimalInput(rawAmount);
      if (!parsed.ok) {
        errors.push(`${config.title}: ${parsed.error}`);
        return;
      }

      options.push({
        id: config.key,
        label: buildPaymentLabel(config, parsed.value),
        amount: parsed.value,
        kind: config.paymentKind,
      });
    });

    return { errors, options };
  }, [amounts, selectedConfigs]);

  const comparison = useMemo(() => {
    if (!parsedCashRate.ok || parsedOptions.options.length === 0) return [];
    return comparePaymentOptions(parsedOptions.options, rates, parsedCashRate.value);
  }, [parsedCashRate, parsedOptions.options, rates]);

  const best = comparison[0];
  const secondBest = comparison[1];
  const suggestedSellUsdAmount = amounts.divisas.trim() || (best ? String(best.equivalentUsd) : "");
  const parsedSellUsdAmount = parseDecimalInput(sellUsdAmount.trim() || suggestedSellUsdAmount);
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

  const canCompare = comparison.length > 0;
  const hasInputError = parsedOptions.errors.length > 0 || !parsedCashRate.ok;

  function updateEnabled(key: OfferKey, value: boolean) {
    setEnabled((current) => ({ ...current, [key]: value }));
  }

  function updateAmount(key: OfferKey, value: string) {
    setAmounts((current) => ({ ...current, [key]: value }));
  }

  function loadExample() {
    setEnabled({ divisas: true, ves_bcv: true, ves_usdt: true, eur: false });
    setAmounts({ divisas: "20", ves_bcv: "15000", ves_usdt: "17000", eur: "" });
    setCashRate("640");
    setSellUsdAmount("20");
  }

  return (
    <>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.panelHeader}>
          <View style={styles.stepBadge}>
            <Text style={[styles.stepText, { color: colors.primary }]}>1</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Que te ofrecio la tienda?</Text>
            <Text style={[styles.helperText, { color: colors.mutedText }]}>
              Marca solo las formas de pago que aplican para esta compra.
            </Text>
          </View>
        </View>

        <View style={styles.optionList}>
          {offerConfigs.map((config) => (
            <View
              key={config.key}
              style={[styles.switchRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <View style={styles.switchCopy}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{config.title}</Text>
                <Text style={[styles.optionDescription, { color: colors.softText }]}>{config.description}</Text>
              </View>
              <Switch
                value={enabled[config.key]}
                onValueChange={(value) => updateEnabled(config.key, value)}
                trackColor={{ false: colors.strongBorder, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.panelHeader}>
          <View style={styles.stepBadge}>
            <Text style={[styles.stepText, { color: colors.primary }]}>2</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingresa los montos</Text>
            <Text style={[styles.helperText, { color: colors.mutedText }]}>
              Llena los precios tal como te los dieron. La app compara automaticamente.
            </Text>
          </View>
        </View>

        {selectedConfigs.length === 0 ? (
          <View style={[styles.notice, { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder }]}>
            <Text style={[styles.noticeText, { color: colors.warningText }]}>
              Activa al menos una forma de pago para empezar.
            </Text>
          </View>
        ) : null}

        {selectedConfigs.map((config) => (
          <View key={config.key} style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedText }]}>{config.title}</Text>
            <TextInput
              value={amounts[config.key]}
              onChangeText={(value) => updateAmount(config.key, value)}
              keyboardType="decimal-pad"
              placeholder={config.placeholder}
              placeholderTextColor={colors.softText}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.strongBorder, color: colors.text },
              ]}
            />
          </View>
        ))}

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Tasa manual divisas</Text>
          <TextInput
            value={cashRate}
            onChangeText={setCashRate}
            keyboardType="decimal-pad"
            placeholder="640"
            placeholderTextColor={colors.softText}
            style={[
              styles.input,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.strongBorder, color: colors.text },
            ]}
          />
        </View>

        <Pressable style={[styles.secondaryButton, { borderColor: colors.strongBorder }]} onPress={loadExample}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Ver ejemplo</Text>
        </Pressable>

        {hasInputError ? (
          <View style={[styles.notice, { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder }]}>
            <Text style={[styles.noticeText, { color: colors.warningText }]}>
              {!parsedCashRate.ok ? parsedCashRate.error : parsedOptions.errors[0]}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.panelHeader}>
          <View style={styles.stepBadge}>
            <Text style={[styles.stepText, { color: colors.primary }]}>3</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recomendacion</Text>
            <Text style={[styles.helperText, { color: colors.mutedText }]}>
              Ordenado de mas barato a mas caro.
            </Text>
          </View>
        </View>

        {!canCompare ? (
          <View style={[styles.notice, { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder }]}>
            <Text style={[styles.noticeText, { color: colors.infoText }]}>
              Ingresa al menos un monto valido para ver el resultado.
            </Text>
          </View>
        ) : null}

        {best ? (
          <View style={[styles.bestPanel, { backgroundColor: colors.successSurface, borderColor: colors.successBorder }]}>
            <Text style={[styles.bestEyebrow, { color: colors.successText }]}>Te conviene pagar en</Text>
            <Text style={[styles.bestTitle, { color: colors.successText }]}>{best.label}</Text>
            <Text style={[styles.bestText, { color: colors.successText }]}>
              Equivale a {formatVes(best.equivalentVes)} o {formatUsd(best.equivalentUsd)}.
            </Text>
            {secondBest ? (
              <Text style={[styles.bestText, { color: colors.successText }]}>
                Ahorras {formatVes(secondBest.differenceVes)} ({secondBest.differencePercent.toFixed(2)}%) vs la
                siguiente opcion.
              </Text>
            ) : null}
          </View>
        ) : null}

        {comparison.map((item, index) => (
          <View key={item.optionId} style={[styles.resultRow, { borderTopColor: colors.border }]}>
            <View style={styles.resultMain}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.resultMeta, { color: colors.softText }]}>
                {formatVes(item.equivalentVes)} - {formatUsd(item.equivalentUsd)}
              </Text>
            </View>
            <Text
              style={[
                styles.badge,
                { backgroundColor: colors.surfaceMuted, color: colors.mutedText },
                item.isBest && { backgroundColor: colors.primary, color: colors.primaryText },
              ]}>
              {getRankLabel(item, index, comparison.length)}
            </Text>
          </View>
        ))}
      </View>

      {best ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Y si vendes primero?</Text>
          <Text style={[styles.helperText, { color: colors.mutedText }]}>
            Simula vender divisas o USDT y compara contra la mejor opcion directa.
          </Text>

          <Text style={[styles.label, { color: colors.mutedText }]}>Que vas a vender</Text>
          <SegmentedControl options={sellInstrumentOptions} value={sellInstrument} onChange={setSellInstrument} />

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedText }]}>Monto en USD</Text>
            <TextInput
              value={sellUsdAmount}
              onChangeText={setSellUsdAmount}
              keyboardType="decimal-pad"
              placeholder={suggestedSellUsdAmount || "20"}
              placeholderTextColor={colors.softText}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.strongBorder, color: colors.text },
              ]}
            />
          </View>

          {sellScenario ? (
            <View style={[styles.notice, { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder }]}>
              <Text style={[styles.noticeText, { color: colors.infoText }]}>
                Recibirias aprox. {formatVes(sellScenario.receivedVes)} a una tasa de{" "}
                {formatVes(sellScenario.usedRate)} por USD.
              </Text>
              <Text style={[styles.noticeText, { color: colors.infoText }]}>
                Diferencia vs pagar directo: {formatVes(sellScenario.differenceVsBestVes)}.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  panelHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  stepBadge: {
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "900",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionList: {
    gap: 10,
  },
  switchRow: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12,
  },
  switchCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 19,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  notice: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bestPanel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  bestEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bestTitle: {
    fontSize: 21,
    fontWeight: "900",
  },
  bestText: {
    fontSize: 14,
    lineHeight: 20,
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
    gap: 3,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  resultMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
