import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { Pressable } from "react-native";
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
import { t } from "@/i18n";
import { useLocale } from "@/context/LocaleContext";

/**
 * SC-MOB-DAP — the passport tab: published passports from the CMS, each
 * opening the Digital Asset Passport detail (/passport/[slug], root stack).
 */
export default function PassportList() {
  const [passports, setPassports] = useState<
    { id: string; slug: string; title: string }[] | null
  >(null);
  const [error, setError] = useState(false);
  useLocale();

  const load = useCallback(async () => {
    setError(false);
    setPassports(null);
    try {
      setPassports(await api.listPassports());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <H1>{t("passports.title")}</H1>
      {error && (
        <>
          <ErrorText>{t("common.error")}</ErrorText>
          <Button title={t("common.retry")} onPress={load} variant="ghost" />
        </>
      )}
      {!passports && !error && <Loading />}
      {passports?.length === 0 && (
        <Body muted>{t("passports.empty")}</Body>
      )}
      {passports?.map((p) => (
        <Link key={p.id} href={`/passport/${p.slug}`} asChild>
          <Pressable>
            <Card>
              <Body style={{ fontWeight: "600" }}>{p.title}</Body>
            </Card>
          </Pressable>
        </Link>
      ))}
      <Disclosure />
    </Screen>
  );
}
