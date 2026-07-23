import { api } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { BarList } from "@/components/BarList";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { formatNumber } from "@/lib/format";
import type { Tokenomics } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TokenomicsPage() {
  const { data, error } = await api.tokenomics();
  const t: Tokenomics | null = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tokenomics"
        subtitle="Illustrative token model \u2014 not final, subject to written authorization."
      />
      {error && <ApiErrorBanner error={error} />}
      {t && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Symbol" value={t.symbol} />
            <StatCard
              label="Cap (illustrative)"
              value={formatNumber(t.capIllustrative)}
              sub="tokens"
            />
            <StatCard label="Reserve ratio" value={t.reserveRatio} />
            <StatCard
              label="Transfer fee"
              value={`${t.transferFee}%`}
              accent="#46A171"
            />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold">Allocations</h3>
            <BarList
              items={t.allocations.map((a) => ({
                label: a.bucket,
                value: a.pct,
              }))}
            />
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-text-2">
            {t.note}
          </div>
        </>
      )}
    </div>
  );
}
