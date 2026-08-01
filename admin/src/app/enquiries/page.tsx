import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { ExportCsv } from "@/components/ExportCsv";
import { formatDate, maskEmail } from "@/lib/format";
import type { Enquiry } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  enterprise: "Enterprise",
  "asset-owner": "Asset owner",
  "industrial-buyer": "Industrial buyer",
  contact: "Contact",
};

const CSV_COLUMNS = [
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "kind", label: "Kind" },
  { key: "company", label: "Organisation" },
  { key: "message", label: "Message" },
  { key: "locale", label: "Locale" },
  { key: "createdAt", label: "Received" },
];

export default async function EnquiriesPage() {
  const { data, error } = await api.enquiries();
  const rows = data ?? [];
  const csvRows = rows.map((r) => ({
    ...r,
    kind: KIND_LABEL[r.kind] ?? r.kind,
  }));

  const cols: Column<Enquiry>[] = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email", render: (r) => maskEmail(r.email) },
    {
      key: "kind",
      label: "Kind",
      render: (r) => <Badge>{KIND_LABEL[r.kind] ?? r.kind}</Badge>,
    },
    {
      key: "company",
      label: "Organisation",
      render: (r) => r.company ?? "—",
    },
    {
      key: "message",
      label: "Message",
      render: (r) => (
        <span className="line-clamp-2 max-w-md text-text-2">{r.message}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Received",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiries"
        subtitle="Enterprise, asset-owner, industrial-buyer and contact enquiries from the website."
      />
      <div className="flex justify-end">
        <ExportCsv filename="enquiries" columns={CSV_COLUMNS} rows={csvRows} />
      </div>
      {error && <ApiErrorBanner error={error} />}
      <DataTable columns={cols} rows={rows} empty="No enquiries yet." />
    </div>
  );
}
