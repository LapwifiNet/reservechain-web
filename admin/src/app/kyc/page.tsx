import Link from "next/link";
import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatDate, formatNumber } from "@/lib/format";
import type { KycCase, KycStats } from "@/lib/types";

export const dynamic = "force-dynamic";

// Read-only by design.
//
// The backend also exposes POST /kyc/cases, POST /kyc/cases/:id/review and
// POST /kyc/cases/:id/screen. They are deliberately not wired into this console:
// the admin authenticates to the API with a single shared service token, so
// every review would be attributed to that one machine identity rather than to a
// named compliance officer. Review decisions must be individually attributable,
// so write actions wait until the console has real per-user login.
//
// Case payloads, subject names and document references are never written to the
// console or to server logs (AGENTS.md guardrail 8), and this page deliberately
// offers no export or download control.

const EM_DASH = "—";

export default async function KycPage() {
  const [statsResult, casesResult] = await Promise.all([
    api.kycStats(),
    api.kycCases(100),
  ]);

  const stats: KycStats = statsResult.data ?? { total: 0, byStatus: [] };
  const cases = casesResult.data ?? [];
  const error = statsResult.error ?? casesResult.error;

  const cols: Column<KycCase>[] = [
    {
      key: "legalName",
      label: "Legal name",
      render: (r) => (
        <Link href={`/kyc/${r.id}`} className="text-brand hover:underline">
          {r.legalName}
        </Link>
      ),
    },
    {
      key: "subjectType",
      label: "Subject",
      render: (r) => <Badge>{r.subjectType}</Badge>,
    },
    { key: "country", label: "Country" },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
    },
    {
      key: "riskLevel",
      label: "Risk",
      render: (r) => (r.riskLevel ? <Badge>{r.riskLevel}</Badge> : EM_DASH),
    },
    {
      key: "reviewedBy",
      label: "Reviewed by",
      render: (r) => r.reviewedBy ?? EM_DASH,
    },
    {
      key: "createdAt",
      label: "Opened",
      align: "right",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC / KYB"
        subtitle="Identity and business verification cases. Read-only view of the compliance backend."
      />

      {error && <ApiErrorBanner error={error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total cases"
          value={formatNumber(stats.total)}
          sub="All subjects"
        />
        {stats.byStatus.map((bucket) => (
          <StatCard
            key={bucket.status}
            label={bucket.status.replace(/_/g, " ")}
            value={formatNumber(bucket.count)}
            sub="Cases in this state"
          />
        ))}
      </div>

      {stats.byStatus.length === 0 && (
        <EmptyState message="No case status breakdown available yet." />
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Sanctions / PEP screening</h2>
          <Badge>Illustrative</Badge>
        </div>
        <p className="mt-2 text-xs text-text-2">
          Any screening result surfaced in this console is illustrative. Live
          sanctions, PEP and adverse-media screening is in development and remains
          inactive pending written authorization and a contracted provider.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold">Cases</h2>
        <DataTable
          columns={cols}
          rows={cases}
          empty="No KYC cases recorded yet."
        />
      </div>
    </div>
  );
}
