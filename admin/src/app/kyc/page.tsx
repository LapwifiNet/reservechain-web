import { GatedNotice } from "@/components/GatedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function KycPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="KYC / KYB" />
      <GatedNotice
        title="Identity & Business Verification"
        code={501}
        phase="P6"
        description="KYC/KYB onboarding, sanctions screening and eligibility gating. Wired into the admin surface but inactive until the compliance provider and legal framework are approved."
      />
    </div>
  );
}
