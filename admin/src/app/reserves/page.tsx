import { GatedNotice } from "@/components/GatedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function ReservesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reserve Reports" />
      <GatedNotice
        title="Proof-of-Reserves"
        code={501}
        phase="P11"
        description="Independent reserve attestation and on-chain proof reporting. The backend exposes this endpoint but returns HTTP 501 until custodian and auditor integrations are contracted and authorized."
      />
    </div>
  );
}
