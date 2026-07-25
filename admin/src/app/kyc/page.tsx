import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { api } from "@/lib/api";
import { KycConsole } from "@/components/kyc/KycConsole";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const [statsRes, casesRes] = await Promise.all([
    api.kycStats(),
    api.kycCases(),
  ]);
  const error = statsRes.error || casesRes.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC / KYB"
        subtitle="Identity & business verification case management (compliance surface)."
      />
      {error && <ApiErrorBanner error={error} />}
      <KycConsole
        stats={statsRes.data ?? { total: 0, byStatus: [] }}
        cases={casesRes.data ?? []}
      />
    </div>
  );
}
