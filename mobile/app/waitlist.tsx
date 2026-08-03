import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  H1,
  Body,
  Card,
  Field,
  Checkbox,
  Button,
  ErrorText,
} from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { api, ApiError } from "@/api/client";
import type { WaitlistInvestorType } from "@/api/types";
import { t } from "@/i18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fixed by the API's DTO (@IsIn). A free-text box here would 400 on anything
// else, which is what the overlay shipped.
const INVESTOR_TYPES: WaitlistInvestorType[] = [
  "institution",
  "investor",
  "partner",
  "other",
];

export default function Waitlist() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [investorType, setInvestorType] =
    useState<WaitlistInvestorType>("investor");
  const [region, setRegion] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError(t("waitlist.nameRequired"));
    if (!EMAIL_RE.test(email)) return setError(t("waitlist.invalidEmail"));
    if (!consent) return setError(t("waitlist.consentRequired"));

    setLoading(true);
    try {
      // Field names and the investorType union are fixed by the API's DTO:
      // fullName (not name), a required investorType from a closed set, and
      // consent that must be literally true. There is no `region` field — the
      // API strips unknown keys, so sending one silently loses it.
      await api.joinWaitlist({
        fullName: name.trim(),
        email: email.trim(),
        investorType,
        consent: true,
        organization: region.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      // 429 = the per-visitor rate limit fired; the form is fine, the user
      // was too fast. Show the friendly message instead of the raw
      // "ThrottlerException" text the API returns.
      setError(
        e instanceof ApiError && e.status === 429
          ? t("waitlist.rateLimited")
          : e instanceof ApiError
            ? e.message
            : t("common.error"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <H1>{t("waitlist.title")}</H1>
        <Card>
          <Body>{t("waitlist.success")}</Body>
        </Card>
        <Button
          testID="btn-home"
          title={t("nav.home")}
          onPress={() => router.replace("/")}
          variant="ghost"
        />
        <Disclosure />
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>{t("waitlist.title")}</H1>
      <Card>
        <Field
          testID="input-name"
          label={t("waitlist.name")}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Field
          testID="input-email"
          label={t("waitlist.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Body muted>{t("waitlist.investorType")}</Body>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {INVESTOR_TYPES.map((type) => (
            <Pressable
              key={type}
              testID={`type-${type}`}
              onPress={() => setInvestorType(type)}
              accessibilityRole="radio"
              accessibilityState={{ selected: investorType === type }}
            >
              <Body style={investorType === type ? undefined : { opacity: 0.5 }}>
                {t(`waitlist.type.${type}`)}
              </Body>
            </Pressable>
          ))}
        </View>
        <Field
          testID="input-region"
          label={t("waitlist.region")}
          value={region}
          onChangeText={setRegion}
        />
      </Card>

      <Disclosure />
      <Checkbox
        testID="chk-consent"
        checked={consent}
        onToggle={() => setConsent((c) => !c)}
        label={t("waitlist.consent")}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button
        testID="btn-submit"
        title={t("waitlist.submit")}
        onPress={submit}
        loading={loading}
        disabled={!consent}
      />
    </Screen>
  );
}
