import { api } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import type { AssetProgram } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const { data, error } = await api.programs();
  const programs: AssetProgram[] = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Programs"
        subtitle="Industrial-metal programs onboarded to the platform."
      />
      {error && <ApiErrorBanner error={error} />}
      {programs.length === 0 ? (
        <EmptyState message="No programs configured." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-mono text-text-2">
                    {p.code}
                  </span>
                  <h3 className="text-base font-semibold">{p.name}</h3>
                </div>
                <Badge>{p.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-text-2">Metal</div>
                  <div>{p.metal}</div>
                </div>
                <div>
                  <div className="text-xs text-text-2">Purity</div>
                  <div
                    className="tabular-nums"
                    style={{ color: p.code === "CP" ? "#C0703B" : "#6B7785" }}
                  >
                    {p.purity}
                  </div>
                </div>
              </div>
              {p.description && (
                <p className="mt-4 text-sm leading-relaxed text-text-2">
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
