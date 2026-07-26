import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Screen,
  H1,
  H2,
  Body,
  Card,
  Loading,
  ErrorText,
} from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { api } from "@/api/client";
import type { Passport } from "@/api/types";
import { t } from "@/i18n";

export default function PassportDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setError(false);
    api
      .getPassport(slug)
      .then(setPassport)
      .catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <Screen>
        <ErrorText>{t("common.error")}</ErrorText>
      </Screen>
    );
  if (!passport)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  return (
    <Screen>
      <H1>{t("passport.title")}</H1>
      <Card>
        <H2>{passport.title}</H2>
        <Body muted>{passport.program.metal ?? ""}</Body>
        {passport.program.purity ? (
          <Body>
            {t("programs.purity")}: {passport.program.purity} (
            {t("passport.illustrative")})
          </Body>
        ) : null}
        {/* Provenance facts come from the CMS as label/value pairs; the app
            renders whatever is published rather than assuming named fields. */}
        {passport.highlights.map((h) => (
          <Body key={`${h.label}-${h.value}`}>
            {h.label}: {h.value}
          </Body>
        ))}
      </Card>

      <Card>
        <H2>{t("passport.tokenMapping")}</H2>
        {passport.tokenMapping ? (
          <Body>
            {passport.tokenMapping.contractAddress ?? "—"} (
            {t("passport.illustrative")})
          </Body>
        ) : (
          <Body muted>{t("passport.notActivated")}</Body>
        )}
      </Card>

      <Disclosure />
    </Screen>
  );
}
