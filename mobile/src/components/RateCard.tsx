import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { appColors } from "../theme/colors";

type Props = {
  title: string;
  value: number;
  updatedAt: string;
};

export function RateCard({ title, value, updatedAt }: Props) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.mutedText }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value.toFixed(2)} Bs</Text>
      <Text style={[styles.meta, { color: colors.softText }]}>
        Actualizado: {new Date(updatedAt).toLocaleString("es-VE")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
  },
  meta: {
    fontSize: 12,
  },
});
