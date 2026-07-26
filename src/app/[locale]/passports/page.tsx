import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { listPassports } from "@/lib/cms";

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Passports" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PassportsIndexPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Passports" });
  const passports = await listPassports();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-neutral-100">{t("title")}</h1>
      <p className="mt-2 text-neutral-400">{t("subtitle")}</p>

      {passports.length === 0 ? (
        <p className="mt-8 text-neutral-500">{t("empty")}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {passports.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/passports/${p.slug}`}
                className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-4 transition hover:border-neutral-600"
              >
                <span>
                  <span className="block font-medium text-neutral-100">
                    {p.title}
                  </span>
                  <span className="block text-sm text-neutral-400">
                    {t(`metals.${p.metal || "other"}`)}
                    {p.purity ? ` · ${p.purity}` : ""}
                  </span>
                </span>
                <span className="text-sm text-neutral-400">
                  {t("viewPassport")} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
