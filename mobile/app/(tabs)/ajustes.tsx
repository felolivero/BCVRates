import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AlphaShell } from "../../src/components/AlphaShell";
import { parseDecimalInput } from "../../src/domain/numberInput";

export default function SettingsScreen() {
  const [cashRate, setCashRate] = useState("140");
  const [message, setMessage] = useState("Esta tasa se conectara al almacenamiento local en la siguiente fase.");

  return (
    <AlphaShell title="Ajustes" subtitle="Configura valores personales de calculo.">
      <View style={styles.panel}>
        <Text style={styles.label}>Tasa USD efectivo</Text>
        <TextInput value={cashRate} onChangeText={setCashRate} keyboardType="decimal-pad" style={styles.input} />
        <Pressable
          style={styles.button}
          onPress={() => {
            const parsed = parseDecimalInput(cashRate);
            setMessage(parsed.ok ? `Tasa valida: ${parsed.value.toFixed(2)} Bs por USD.` : parsed.error);
          }}>
          <Text style={styles.buttonText}>Validar tasa</Text>
        </Pressable>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Pendiente para beta</Text>
        <Text style={styles.copy}>Guardar tasa localmente, conectar Supabase y mostrar fuente real de DolarApi.</Text>
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
  button: {
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 8,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  message: {
    color: "#4b5563",
    lineHeight: 20,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  copy: {
    color: "#4b5563",
    lineHeight: 21,
  },
});
