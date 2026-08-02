import { Linking, Pressable } from "react-native";
import { Screen, H1, Body, Card } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { t } from "@/i18n";
import { useLocale } from "@/context/LocaleContext";
import { colors, font } from "@/theme";

/**
 * SC-MOB-DOC — reference documents. No fake downloads: whitepaper and
 * roadmap are labelled In preparation / Pending, and the legal pages open in
 * the browser (they exist on the website, not as in-app screens).
 */
const LEGAL_LINKS = [
  { key: "privacy", slug: "privacy" },
  { key: "terms", slug: "terms" },
  { key: "risk", slug: "risk-disclosure" },
] as const;

export default function Documents() {
  useLocale();
  const locale = useLocale().locale;

  return (
    <Screen>
      <H1>{t("documents.title")}</H1>
      <Body muted>{t("documents.intro")}</Body>

      <Card>
        <Body style={{ fontWeight: "600" }}>{t("documents.whitepaper")}</Body>
        <Body muted>{t("documents.inPreparation")}</Body>
      </Card>
      <Card>
        <Body style={{ fontWeight: "600" }}>{t("documents.roadmap")}</Body>
        <Body muted>{t("documents.pending")}</Body>
      </Card>

      {LEGAL_LINKS.map(({ key, slug }) => (
        <Card key={key}>
          <Pressable
            onPress={() =>
              Linking.openURL(`https://reservechain.io/${locale}/${slug}`)
            }
            accessibilityRole="link"
          >
            <Body style={{ fontWeight: "600", color: colors.copper }}>
              {t(`documents.${key}`)} ↗
            </Body>
          </Pressable>
          <Body muted style={{ fontSize: font.small }}>
            {t("documents.available")}
          </Body>
        </Card>
      ))}

      <Disclosure />
    </Screen>
  );
}
