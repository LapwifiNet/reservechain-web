import { useState } from "react";
import {
  Screen,
  H1,
  H2,
  Body,
  Card,
  Field,
  Button,
  ErrorText,
  Loading,
} from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { t } from "@/i18n";

type Mode = "login" | "register";

export default function Investor() {
  const { ready, token, investor, status, login, register, logout } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(email.trim(), password, fullName.trim());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  if (token) {
    // The API returns kyc: { status, riskLevel, sanctions } — not a flat
    // kycStatus. Reading the old field made every account show "none".
    const kyc = status?.kyc?.status ?? "not_started";
    return (
      <Screen>
        <H1>{t("investor.status")}</H1>
        <Card>
          {investor ? <H2>{investor.fullName}</H2> : null}
          {investor ? <Body muted>{investor.email}</Body> : null}
          <Body>
            {t("investor.kyc")}: {t(`investor.kyc.${kyc}`)}
          </Body>
        </Card>
        <Card>
          <Body>{t("investor.gatedNote")}</Body>
        </Card>
        <Button
          testID="btn-logout"
          title={t("investor.logout")}
          onPress={logout}
          variant="ghost"
        />
        <Disclosure />
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>{mode === "login" ? t("investor.login") : t("investor.register")}</H1>
      <Card>
        {mode === "register" && (
          <Field
            testID="input-fullname"
            label={t("investor.fullName")}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}
        <Field
          testID="input-email"
          label={t("investor.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          testID="input-password"
          label={t("investor.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </Card>
      {error && <ErrorText>{error}</ErrorText>}
      <Button
        testID="btn-submit"
        title={mode === "login" ? t("investor.login") : t("investor.register")}
        onPress={submit}
        loading={loading}
      />
      <Button
        testID="btn-toggle"
        title={
          mode === "login" ? t("investor.noAccount") : t("investor.haveAccount")
        }
        onPress={() => {
          setError(null);
          setMode(mode === "login" ? "register" : "login");
        }}
        variant="ghost"
      />
      <Disclosure />
    </Screen>
  );
}
