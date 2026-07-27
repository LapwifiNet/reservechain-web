"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function PortalAuthForm({
  mode,
  locale,
}: {
  mode: "login" | "register";
  locale: string;
}) {
  const t = useTranslations("portal");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { fullName, email, password }
            : { email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(
          data?.error === "email_already_registered"
            ? t("errAlready")
            : mode === "register"
              ? t("errRegister")
              : t("errLogin"),
        );
        setBusy(false);
        return;
      }
      router.push(`/${locale}/portal`);
      router.refresh();
    } catch {
      setError(t("errNetwork"));
      setBusy(false);
    }
  }

  // htmlFor/id on every field: the labels were rendered but unassociated,
  // which axe reports as a critical `label` violation — a screen reader
  // announced three unnamed edit boxes.
  const field =
    "w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-text outline-none focus:border-copper";

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-serif text-2xl text-text">
        {mode === "register" ? t("registerTitle") : t("loginTitle")}
      </h1>
      <p className="mt-1.5 text-sm text-text2">{t("subtitle")}</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === "register" && (
          <div>
            <label htmlFor="portal-fullname" className="mb-1.5 block text-xs text-text2">{t("fullName")}</label>
            <input
              id="portal-fullname"
              className={field}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label htmlFor="portal-email" className="mb-1.5 block text-xs text-text2">{t("email")}</label>
          <input
            id="portal-email"
            className={field}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="portal-password" className="mb-1.5 block text-xs text-text2">{t("password")}</label>
          <input
            id="portal-password"
            className={field}
            aria-describedby={mode === "register" ? "portal-password-hint" : undefined}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {mode === "register" && (
            <p id="portal-password-hint" className="mt-1 text-[11px] text-text2">{t("passwordHint")}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-copperDeep px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? t("working") : mode === "register" ? t("registerCta") : t("loginCta")}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-text2">
        {mode === "register" ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={mode === "register" ? "/portal/login" : "/portal/register"}
          className="text-copper underline"
        >
          {mode === "register" ? t("loginCta") : t("registerCta")}
        </Link>
      </p>
    </div>
  );
}
