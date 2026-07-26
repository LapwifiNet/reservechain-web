import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import {
  Screen,
  H1,
  Body,
  Card,
  Loading,
  ErrorText,
  Button,
} from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import { api } from "@/api/client";
import type { AssetProgram } from "@/api/types";
import { t } from "@/i18n";

export default function ProgramDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [program, setProgram] = useState<AssetProgram | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setError(false);
    api
      .getProgram(slug)
      .then(setProgram)
      .catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <Screen>
        <ErrorText>{t("common.error")}</ErrorText>
      </Screen>
    );
  if (!program)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  return (
    <Screen>
      <H1>{program.title}</H1>
      <Card>
        <Body muted>{program.metal}</Body>
        {program.purity ? (
          <Body>
            {t("programs.purity")}: {program.purity} (
            {t("passport.illustrative")})
          </Body>
        ) : null}
        {program.summary ? <Body>{program.summary}</Body> : null}
      </Card>
      <Link href={`/passport/${program.slug}`} asChild>
        <Button title={t("programs.viewPassport")} onPress={() => {}} />
      </Link>
      <Disclosure />
    </Screen>
  );
}
