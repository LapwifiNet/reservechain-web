import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import {
  Screen,
  H1,
  H2,
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

export default function ProgramsList() {
  const [programs, setPrograms] = useState<AssetProgram[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setPrograms(null);
    try {
      setPrograms(await api.listPrograms());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <H1>{t("programs.title")}</H1>
      {error && (
        <>
          <ErrorText>{t("common.error")}</ErrorText>
          <Button title={t("common.retry")} onPress={load} variant="ghost" />
        </>
      )}
      {!programs && !error && <Loading />}
      {programs?.length === 0 && <Body muted>{t("programs.empty")}</Body>}
      {programs?.map((p) => (
        <Link key={p.id} href={`/programs/${p.slug}`} asChild>
          <Pressable>
            <Card>
              <H2>{p.title}</H2>
              <Body muted>{p.metal}</Body>
              {p.purity ? (
                <Body>
                  {t("programs.purity")}: {p.purity}
                </Body>
              ) : null}
            </Card>
          </Pressable>
        </Link>
      ))}
      <Disclosure />
    </Screen>
  );
}
