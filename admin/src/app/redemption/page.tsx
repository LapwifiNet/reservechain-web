import { GatedNotice } from "@/components/GatedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function RedemptionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Redemption" />
      <GatedNotice
        title="Token Redemption & Burn"
        code={501}
        phase="P12"
        description="Redemption requests and on-chain burn reconciliation against physical delivery. The endpoint responds with HTTP 501 and stays disabled until redemption operations are authorized."
      />
    </div>
  );
}
