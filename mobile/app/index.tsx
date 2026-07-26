import { Link } from "expo-router";
import { View } from "react-native";
import { Screen, H1, Body, Button, Card } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useLocale } from "@/context/LocaleContext";
import { t } from "@/i18n";
import { spacing } from "@/theme";

export default function Home() {
  // Subscribe to locale so the screen re-renders on language change.
  useLocale();
  return (
    <Screen>
      <LocaleSwitcher />
      <H1>{t("home.title")}</H1>
      <Body muted>{t("home.subtitle")}</Body>

      <View style={{ gap: spacing.sm }}>
        <Link href="/programs" asChild>
          <Button title={t("home.explorePrograms")} onPress={() => {}} />
        </Link>
        <Link href="/waitlist" asChild>
          <Button title={t("home.join")} variant="ghost" onPress={() => {}} />
        </Link>
        <Link href="/investor" asChild>
          <Button
            title={t("nav.investor")}
            variant="ghost"
            onPress={() => {}}
          />
        </Link>
      </View>

      <Card>
        <Body>{t("investor.gatedNote")}</Body>
      </Card>

      <Disclosure />
    </Screen>
  );
}
