import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AlphaShell({ title, subtitle, children }: Props) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    gap: 6,
    marginTop: 8,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
  },
});
