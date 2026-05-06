import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { appColors } from "../theme/colors";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AlphaShell({ title, subtitle, children }: Props) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];

  return (
    <ScrollView style={[styles.page, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
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
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
