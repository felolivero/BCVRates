import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { appColors } from "../theme/colors";

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = appColors[scheme];

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              { borderColor: colors.strongBorder, backgroundColor: colors.surfaceMuted },
              selected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}>
            <Text style={[styles.label, { color: colors.mutedText }, selected && { color: colors.primaryText }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
