import { api } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { BarList } from "@/components/BarList";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatDate } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

type Activity = DashboardStats["recentActivity"][number];

export default async function OverviewPage() {
  const { data, error } = await api.dashboardStats();
  const stats: DashboardStats = data ?? {
    totals: { waitlist: 0, programs: 0, records: 0, passportsIssued: 0 },
    registrationsByType: [],
    recentActivity: [],
  };

  const cols: Column<Activity>[] = [
    { key: "assetId", label: "Asset ID" },
    { key: "program", label: "Program" },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
    },
    {
      key: "updatedAt",
      label: "Updated",
      align: "right",
      render: (r) => formatDate(r.updatedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Live operational metrics from the ReserveChain backend (testnet)."
      />
      {error && <ApiErrorBanner error={error} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Waitlist"
          value={stats.totals.waitlist}
          sub="Registered interest"
          accent="#2783DE"
        />
        <StatCard
          label="Asset Programs"
          value={stats.totals.programs}
          sub="Copper \u00b7 Nickel"
          accent="#C0703B"
        />
        <StatCard
          label="Asset Records"
          value={stats.totals.records}
          sub="Registered lots"
        />
        <StatCard
          label="Passports Issued"
          value={stats.totals.passportsIssued}
          sub="Digital Asset Passports"
          accent="#46A171"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold">
            Registrations by investor type
          </h3>
          <BarList
            items={stats.registrationsByType.map((r) => ({
              label: r.type,
              value: r.count,
            }))}
          />
        </div>
        <div className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Recent asset activity</h3>
          <DataTable
            columns={cols}
            rows={stats.recentActivity}
            empty="No recent activity."
          />
        </div>
      </div>
    </div>
  );
}
