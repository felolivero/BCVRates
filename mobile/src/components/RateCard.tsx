import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  value: number;
  updatedAt: string;
};

export function RateCard({ title, value, updatedAt }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value.toFixed(2)} Bs</Text>
      <Text style={styles.meta}>Actualizado: {new Date(updatedAt).toLocaleString("es-VE")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  title: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "700",
  },
  value: {
    color: "#111827",
    fontSize: 26,
    fontWeight: "800",
  },
  meta: {
    color: "#6b7280",
    fontSize: 12,
  },
});
