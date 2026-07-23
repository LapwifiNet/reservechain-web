import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatDate, maskEmail } from "@/lib/format";
import type { WaitlistEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

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
      {error && <ApiErrorBanner error={error} />}
      <DataTable columns={cols} rows={rows} empty="No registrations yet." />
    </div>
  );
}
