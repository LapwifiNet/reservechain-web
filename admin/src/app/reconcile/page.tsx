import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { api } from "@/lib/api";
import { ReconcileConsole } from "@/components/reconcile/ReconcileConsole";

export const dynamic = "force-dynamic";

export default async function ReconcilePage() {
  const [runsRes, exRes] = await Promise.all([
    api.reconcileRuns(),
    api.reconcileExceptions(),
  ]);
  const error = runsRes.error || exRes.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation"
        subtitle="Financial, token and operational reconciliation runs with an exception queue (P17)."
      />
      {error && <ApiErrorBanner error={error} />}
      <ReconcileConsole
        runs={runsRes.data ?? []}
        exceptions={exRes.data ?? []}
      />
    </div>
  );
}
