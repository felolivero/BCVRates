import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { parseDecimalInput } from "../../src/domain/numberInput";
import { appColors } from "../../src/theme/colors";

export default function SettingsScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];
  const [cashRate, setCashRate] = useState("140");
  const [message, setMessage] = useState("Esta tasa se conectara al almacenamiento local en la siguiente fase.");

  return (
    <AlphaShell title="Ajustes" subtitle="Configura valores personales de calculo.">
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Tasa USD efectivo</Text>
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
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => {
            const parsed = parseDecimalInput(cashRate);
            setMessage(parsed.ok ? `Tasa valida: ${parsed.value.toFixed(2)} Bs por USD.` : parsed.error);
          }}>
          <Text style={[styles.buttonText, { color: colors.primaryText }]}>Validar tasa</Text>
        </Pressable>
        <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text>
      </View>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pendiente para beta</Text>
        <Text style={[styles.copy, { color: colors.mutedText }]}>
          Guardar tasa localmente, conectar Supabase y mostrar fuente real de DolarApi.
        </Text>
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
  button: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  message: {
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  copy: {
    lineHeight: 21,
  },
});
