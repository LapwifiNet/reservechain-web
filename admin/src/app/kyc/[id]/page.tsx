import type { ReactNode } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Read-only, for the same reason as the case list: reviews carried out through
// the shared service token could not be attributed to a named compliance
// officer. See the note in ../page.tsx.
//
// Case details are rendered for an authenticated ADMIN/COMPLIANCE session only
// (the backend enforces this) and are never logged (AGENTS.md guardrail 8).

const EM_DASH = "—";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-border/60 py-3 last:border-0">
      <div className="text-xs uppercase tracking-wide text-text-2">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export default async function KycCaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error } = await api.kycCase(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC / KYB case"
        subtitle="Read-only case detail from the compliance backend."
      />

      <div>
        <Link href="/kyc" className="text-sm text-brand hover:underline">
          ← Back to all cases
        </Link>
      </div>

      {error && <ApiErrorBanner error={error} />}

      {!data && !error && <EmptyState message="This case could not be found." />}

      {data && (
        <>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{data.legalName}</h2>
              <div className="flex items-center gap-2">
                <Badge>{data.status}</Badge>
                {data.riskLevel && <Badge>{data.riskLevel}</Badge>}
              </div>
            </div>

            <div className="mt-4">
              <Field label="Case ID">
                <span className="font-mono text-xs">{data.id}</span>
              </Field>
              <Field label="Subject type">
                <Badge>{data.subjectType}</Badge>
              </Field>
              <Field label="Country">{data.country}</Field>
              <Field label="Risk level">
                {data.riskLevel ? <Badge>{data.riskLevel}</Badge> : EM_DASH}
              </Field>
              <Field label="Notes">
                {data.notes ? (
                  <p className="whitespace-pre-wrap text-text-2">{data.notes}</p>
                ) : (
                  EM_DASH
                )}
              </Field>
              <Field label="Reviewed by">{data.reviewedBy ?? EM_DASH}</Field>
              <Field label="Reviewed at">
                {data.reviewedAt ? formatDate(data.reviewedAt) : EM_DASH}
              </Field>
              <Field label="Opened">{formatDate(data.createdAt)}</Field>
              <Field label="Last updated">{formatDate(data.updatedAt)}</Field>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold">Sanctions / PEP screening</h2>
              <Badge>Illustrative</Badge>
            </div>
            <p className="mt-2 text-xs text-text-2">
              No screening has been performed against a live provider. Sanctions,
              PEP and adverse-media screening is in development and remains
              inactive pending written authorization and a contracted provider,
              so no screening outcome is recorded on this case.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <h2 className="text-sm font-semibold">Review actions</h2>
            <p className="mt-2 text-xs text-text-2">
              Review and screening actions are not available in this console. It
              authenticates to the API with a shared service token, so a decision
              could not be attributed to a named compliance officer. These
              actions are planned for when per-user login is available.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
