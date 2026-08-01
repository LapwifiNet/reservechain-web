import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { ExportCsv } from "@/components/ExportCsv";
import { formatDate, maskEmail } from "@/lib/format";
import type { WaitlistEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const CSV_COLUMNS = [
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "investorType", label: "Investor type" },
  { key: "organization", label: "Organisation" },
  { key: "interest", label: "Interest" },
  { key: "consent", label: "Consent" },
  { key: "locale", label: "Locale" },
  { key: "createdAt", label: "Registered" },
];

export default async function WaitlistPage() {
  const { data, error } = await api.waitlist();
  const rows = data ?? [];

  const cols: Column<WaitlistEntry>[] = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email", render: (r) => maskEmail(r.email) },
    {
      key: "investorType",
      label: "Investor type",
      render: (r) => <Badge>{r.investorType}</Badge>,
    },
    {
      key: "consent",
      label: "Consent",
      render: (r) => (r.consent ? "Yes" : "No"),
    },
    {
      key: "createdAt",
      label: "Registered",
      align: "right",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        subtitle="Registrations of interest captured via the public site (consent required)."
      />
      <div className="flex justify-end">
        <ExportCsv filename="waitlist" columns={CSV_COLUMNS} rows={rows} />
      </div>
      {error && <ApiErrorBanner error={error} />}
      <DataTable columns={cols} rows={rows} empty="No registrations yet." />
    </div>
  );
}
