import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { RateCard } from "../../src/components/RateCard";
import { useRates } from "../../src/hooks/useRates";
import { appColors } from "../../src/theme/colors";

export default function RatesScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];
  const { rates, source, message, loading, refresh } = useRates();

  return (
    <AlphaShell
      title="Tasas"
      subtitle="Consulta tasas actuales desde Supabase. Si aun no esta configurado, se muestran datos alpha.">
      <View
        style={[
          styles.notice,
          {
            backgroundColor: source === "supabase" ? colors.successSurface : colors.warningSurface,
            borderColor: source === "supabase" ? colors.successBorder : colors.warningBorder,
          },
        ]}>
        <Text style={[styles.noticeTitle, { color: source === "supabase" ? colors.successText : colors.warningText }]}>
          {source === "supabase" ? "Tasas reales" : source === "cache" ? "Usando cache" : "Modo alpha"}
        </Text>
        <Text style={[styles.noticeText, { color: source === "supabase" ? colors.successText : colors.warningText }]}>
          {message}
        </Text>
        <Pressable style={[styles.refreshButton, { backgroundColor: colors.primary }]} onPress={refresh} disabled={loading}>
          <Text style={[styles.refreshText, { color: colors.primaryText }]}>
            {loading ? "Actualizando..." : "Refrescar desde DolarApi"}
          </Text>
        </Pressable>
      </View>
      {rates.map((rate) => (
        <RateCard key={rate.code} title={rate.sourceName} value={rate.value} updatedAt={rate.sourceUpdatedAt} />
      ))}
    </AlphaShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    alignItems: "center",
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  refreshText: {
    fontWeight: "900",
  },
});
