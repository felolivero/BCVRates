import { StyleSheet, Text, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { RateCard } from "../../src/components/RateCard";
import { seedRates } from "../../src/data/seedRates";

export default function RatesScreen() {
  return (
    <AlphaShell
      title="Tasas"
      subtitle="Alpha con tasas semilla. En la siguiente fase esta pantalla leera desde Supabase y DolarApi.">
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Modo alpha</Text>
        <Text style={styles.noticeText}>
          Estos valores son de prueba para validar el flujo. No los uses para pagar todavia.
        </Text>
      </View>
      {seedRates.map((rate) => (
        <RateCard key={rate.code} title={rate.sourceName} value={rate.value} updatedAt={rate.sourceUpdatedAt} />
      ))}
    </AlphaShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  noticeTitle: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "900",
  },
  noticeText: {
    color: "#92400e",
    fontSize: 14,
    lineHeight: 20,
  },
});
