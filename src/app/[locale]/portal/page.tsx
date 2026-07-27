import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { INVESTOR_COOKIE, fetchInvestorStatus } from "@/lib/investor";
import { Disclosure } from "@/components/Disclosure";
import { StatusTag } from "@/components/StatusTag";
import PortalHeader from "./PortalHeader";
import { routeMetadata } from "@/lib/meta";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return routeMetadata('/portal', params.locale);
}


export const dynamic = "force-dynamic";

const KYC_TONE: Record<string, string> = {
  approved: "pending",
  in_review: "illustrative",
  pending: "illustrative",
  rejected: "notforsale",
  not_started: "pending",
};

export default async function PortalPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const token = cookies().get(INVESTOR_COOKIE)?.value;
  if (!token) redirect(`/${locale}/portal/login`);

  const data = await fetchInvestorStatus(token!);
  if (!data) redirect(`/${locale}/portal/login`);

  const t = await getTranslations("portal");
  const firstName = data.profile.fullName.split(" ")[0] || data.profile.email;

  const card =
    "rounded-xl border border-border bg-surface p-5";
  const dt = "text-xs text-text2";
  const dd = "mt-0.5 text-sm text-text";

  return (
    <div className="mx-auto max-w-content px-5 py-10">
      <PortalHeader name={firstName} locale={locale} />

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {/* Account */}
        <section className={card}>
          <h2 className="font-serif text-lg text-text">{t("account")}</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className={dt}>{t("fullName")}</dt>
              <dd className={dd}>{data.profile.fullName}</dd>
            </div>
            <div>
              <dt className={dt}>{t("email")}</dt>
              <dd className={dd}>{data.profile.email}</dd>
            </div>
            {data.profile.memberSince && (
              <div>
                <dt className={dt}>{t("memberSince")}</dt>
                <dd className={dd}>
                  {new Date(data.profile.memberSince).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Verification (KYC) */}
        <section className={card}>
          <h2 className="font-serif text-lg text-text">{t("verification")}</h2>
          <div className="mt-4 flex items-center gap-2">
            <StatusTag kind={KYC_TONE[data.kyc.status] || "pending"}>
              {t(`kycStatus.${data.kyc.status}`)}
            </StatusTag>
          </div>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className={dt}>{t("riskLevel")}</dt>
              <dd className={dd}>{t(`risk.${data.kyc.riskLevel}`)}</dd>
            </div>
            <div>
              {/* sanctionsLabel, not sanctions: the latter is the value map */}
              <dt className={dt}>{t("sanctionsLabel")}</dt>
              <dd className={dd}>{t(`sanctions.${data.kyc.sanctions}`)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-text2">
            {t("verificationNote")}
          </p>
        </section>

        {/* Waitlist */}
        <section className={card}>
          <h2 className="font-serif text-lg text-text">{t("waitlist")}</h2>
          {data.waitlist ? (
            <dl className="mt-4 space-y-3">
              <div>
                <dt className={dt}>{t("investorType")}</dt>
                <dd className={dd}>{data.waitlist.investorType}</dd>
              </div>
              {data.waitlist.organization && (
                <div>
                  <dt className={dt}>{t("organization")}</dt>
                  <dd className={dd}>{data.waitlist.organization}</dd>
                </div>
              )}
              {data.waitlist.interest && (
                <div>
                  <dt className={dt}>{t("interest")}</dt>
                  <dd className={dd}>{data.waitlist.interest}</dd>
                </div>
              )}
              <div>
                <dt className={dt}>{t("joined")}</dt>
                <dd className={dd}>
                  {new Date(data.waitlist.joinedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-text2">{t("waitlistNone")}</p>
          )}
        </section>

        {/* Programs */}
        <section className={card}>
          <h2 className="font-serif text-lg text-text">{t("programs")}</h2>
          {data.programs.length ? (
            <ul className="mt-4 space-y-3">
              {data.programs.map((p) => (
                <li
                  key={p.code}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface2 px-3.5 py-2.5"
                >
                  <div>
                    <p className="text-sm text-text">{p.name}</p>
                    <p className="text-[12px] text-text2">
                      {p.metal} · {p.purity}
                    </p>
                  </div>
                  <StatusTag kind="illustrative">{t("illustrative")}</StatusTag>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-text2">{t("programsNone")}</p>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Disclosure variant="full" />
      </div>
    </div>
  );
}
