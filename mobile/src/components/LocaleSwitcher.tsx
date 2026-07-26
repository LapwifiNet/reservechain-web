import { StyleSheet, Text, Pressable, View } from "react-native";
import { colors, font, radius, spacing } from "@/theme";
import { SUPPORTED, type Locale } from "@/i18n";
import { useLocale } from "@/context/LocaleContext";

export function LocaleSwitcher() {
  const { locale, change } = useLocale();
  return (
    <View style={styles.row}>
      {SUPPORTED.map((l: Locale) => (
        <Pressable
          key={l}
          onPress={() => change(l)}
          style={[styles.chip, locale === l && styles.chipOn]}
        >
          <Text style={[styles.text, locale === l && styles.textOn]}>
            {l.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs, alignSelf: "flex-end" },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  text: { color: colors.text2, fontSize: font.small, fontWeight: "600" },
  textOn: { color: "#fff" },
});
