import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatDate } from "@/lib/format";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PassportsPage() {
  const { data, error } = await api.passports();
  const rows = data ?? [];

  const cols: Column<Passport>[] = [
    { key: "passportId", label: "Passport ID" },
    {
      key: "program",
      label: "Program",
      render: (r) => r.assetRecord?.program?.name ?? "\u2014",
    },
    { key: "template", label: "Template" },
    { key: "purity", label: "Purity", render: (r) => r.purity ?? "\u2014" },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
    },
    {
      key: "issuedAt",
      label: "Issued",
      align: "right",
      render: (r) => formatDate(r.issuedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Asset Passports"
        subtitle="Per-lot provenance records (illustrative template)."
      />
      {error && <ApiErrorBanner error={error} />}
      <DataTable columns={cols} rows={rows} empty="No passports issued." />
    </div>
  );
}
