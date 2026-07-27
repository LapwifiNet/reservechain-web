import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getPassport } from "@/lib/cms";
import { routeMetadata } from "@/lib/meta";
import PassportView from "@/components/PassportView";

export const revalidate = 300;

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const passport = await getPassport(slug);
  if (!passport) return {};
  const t = await getTranslations({ locale, namespace: "Passports" });
  return {
    title: `${passport.title} · ${t("title")}`,
    description: passport.program.title || undefined,
    // Slug-level canonical: the same passport is reachable in three locales,
    // and without this each one competes with the other two.
    ...routeMetadata(`/passports/${slug}`, locale),
  };
}

export default async function PassportDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const passport = await getPassport(slug);
  if (!passport) notFound();

  const t = await getTranslations({ locale, namespace: "Passports" });
  const metalKey = passport.program.metal || "other";
  const stageKey = passport.stage || "illustrative";

  return (
    <main>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Link
          href="/passports"
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← {t("backToList")}
        </Link>
      </div>
      <PassportView
        passport={passport}
        labels={{
          programLabel: t("programLabel"),
          metalLabel: t("metalLabel"),
          purityLabel: t("purityLabel"),
          stageLabel: t("stageLabel"),
          provenance: t("provenance"),
          tokenMapping: t("tokenMapping"),
          tokenInactive: t("tokenInactive"),
          contractAddress: t("contractAddress"),
          circulatingSupply: t("circulatingSupply"),
          disclosureHeading: t("disclosureHeading"),
          metal: t(`metals.${metalKey}`),
          stage: t(`stages.${stageKey}`),
        }}
      />
    </main>
  );
}
