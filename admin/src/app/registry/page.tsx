import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatDate, formatNumber } from "@/lib/format";
import type { AssetRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const { data, error } = await api.registry();
  const rows = data ?? [];

  const cols: Column<AssetRecord>[] = [
    { key: "assetId", label: "Asset ID" },
    {
      key: "program",
      label: "Program",
      render: (r) => r.program?.name ?? "\u2014",
    },
    {
      key: "metal",
      label: "Metal",
      render: (r) => r.program?.metal ?? "\u2014",
    },
    { key: "batch", label: "Batch", render: (r) => r.batch ?? "\u2014" },
    {
      key: "weightKg",
      label: "Weight (kg)",
      align: "right",
      render: (r) => formatNumber(r.weightKg),
    },
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
        title="Asset Registry"
        subtitle="Registered industrial-metal lots backing the program (illustrative)."
      />
      {error && <ApiErrorBanner error={error} />}
      <DataTable columns={cols} rows={rows} empty="No asset records." />
    </div>
  );
}
