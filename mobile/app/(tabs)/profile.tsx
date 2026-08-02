import { View } from "react-native";
import { Screen, H1, Body, Button, Card } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { t } from "@/i18n";
import { spacing } from "@/theme";

/**
 * SC-MOB-PROFILE / SC-MOB-SETTINGS — investor summary when signed in,
 * language switcher, and sign out. Theme and further settings stay out of
 * scope (single dark theme; the registry notes the gap).
 */
export default function Profile() {
  useLocale();
  const { ready, investor, status, logout } = useAuth();

  return (
    <Screen>
      <H1>{t("profile.title")}</H1>

      {ready && investor ? (
        <Card>
          <Body>{t("profile.investorSignedIn")}</Body>
          <Body style={{ fontWeight: "600" }}>{investor.email}</Body>
          {status?.kyc ? (
            <Body muted>
              {t("profile.kycStatus")}: {status.kyc.status}
            </Body>
          ) : null}
          <View style={{ marginTop: spacing.sm }}>
            <Button
              testID="btn-logout-profile"
              title={t("profile.signOut")}
              variant="ghost"
              onPress={() => logout()}
            />
          </View>
        </Card>
      ) : (
        <Card>
          <Body muted>{t("profile.notSignedIn")}</Body>
        </Card>
      )}

      <Body muted>{t("profile.language")}</Body>
      <LocaleSwitcher />

      <Disclosure />
    </Screen>
  );
}
