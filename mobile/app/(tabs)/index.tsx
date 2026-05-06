import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { ComparisonWizard } from "../../src/components/ComparisonWizard";
import { useRates } from "../../src/hooks/useRates";
import { appColors } from "../../src/theme/colors";

export default function CalculatorScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];
  const { rates, source, message: ratesMessage } = useRates();

  return (
    <AlphaShell
      title="Comparar una compra"
      subtitle="Ingresa los precios que te dio la tienda y te digo cual forma de pago conviene mas.">
      <View style={[styles.sourcePanel, { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder }]}>
        <Text style={[styles.sourceTitle, { color: colors.infoText }]}>
          Tasas: {source === "supabase" ? "Supabase" : source === "cache" ? "Cache" : "Alpha"}
        </Text>
        <Text style={[styles.sourceText, { color: colors.infoText }]}>{ratesMessage}</Text>
      </View>

      <ComparisonWizard rates={rates} />
    </AlphaShell>
  );
}

const styles = StyleSheet.create({
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
