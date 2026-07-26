import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing } from "@/theme";
import { DISCLOSURE } from "@/constants";
import { t } from "@/i18n";

export function Disclosure() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t("common.disclosure")}</Text>
      <Text style={styles.text}>{DISCLOSURE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.warn,
    fontSize: font.small,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  text: { color: colors.text2, fontSize: font.small, lineHeight: 18 },
});
