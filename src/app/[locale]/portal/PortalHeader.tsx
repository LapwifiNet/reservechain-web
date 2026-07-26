"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function PortalHeader({
  name,
  locale,
}: {
  name: string;
  locale: string;
}) {
  const t = useTranslations("portal");
  const router = useRouter();

  async function logout() {
    await fetch("/api/portal/logout", { method: "POST" });
    router.push(`/${locale}/portal/login`);
    router.refresh();
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-text2">{t("title")}</p>
        <h1 className="mt-1 font-serif text-2xl text-text">
          {t("welcome", { name })}
        </h1>
      </div>
      <button
        onClick={logout}
        className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-text2 transition hover:border-copper hover:text-text"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
