import { GatedNotice } from "@/components/GatedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" />
      <GatedNotice
        title="Immutable Audit Trail"
        code={501}
        phase="P18"
        description="Tamper-evident audit logging of admin actions and on-chain events (backed by the ChainEvent store). Read-only preview will activate once access control (P6/P9) and the chain-sync worker are enabled."
      />
    </div>
  );
}
