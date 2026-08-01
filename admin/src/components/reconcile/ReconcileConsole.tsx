"use client";

import { useState } from "react";
import type { ReconcileRun, ReconcileException } from "@/lib/types";
import { formatDate } from "@/lib/format";

const RECONCILERS = [
  { value: "chain_gaps", label: "Chain sync gaps" },
  { value: "audit_integrity", label: "Audit chain integrity" },
  { value: "supply_coverage", label: "Supply / coverage (unavailable)" },
  { value: "redemption_recon", label: "Redemption ledger (unavailable)" },
  { value: "wallet_ledger", label: "Wallet ledger (unavailable)" },
];

const SEV_TONE: Record<string, string> = {
  info: "bg-surface-2 text-text-2",
  warning: "bg-warning/15 text-warning",
  critical: "bg-danger/15 text-danger",
};

/**
 * SC-CMS-RECON — reconciliation runs + exception queue (P17, FR-RECON).
 * Detects and reports; never auto-adjusts. Runs and resolutions are audited.
 */
export function ReconcileConsole({
  runs,
  exceptions,
}: {
  runs: ReconcileRun[];
  exceptions: ReconcileException[];
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [exceptionsState, setExceptionsState] = useState(exceptions);

  async function run(type: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/reconcile/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        setMsg(`Run ${data?.type} completed — ${data?.exceptions?.length ?? 0} exception(s).`);
        // Refresh both surfaces.
        const [r, e] = await Promise.all([
          fetch("/api/reconcile/runs").then((x) => x.json()),
          fetch("/api/reconcile/exceptions").then((x) => x.json()),
        ]);
        if (Array.isArray(r)) setRuns(r);
        if (Array.isArray(e)) setExceptionsState(e);
      } else {
        setMsg(res.status === 401 || res.status === 403 ? "Not authorized." : "Run failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resolve(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/reconcile/exceptions/${id}/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const e = await fetch("/api/reconcile/exceptions").then((x) => x.json());
        if (Array.isArray(e)) setExceptionsState(e);
      }
    } finally {
      setBusy(false);
    }
  }

  const [runsState, setRuns] = useState(runs);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-2">Run a reconciliation</h2>
        <p className="mt-1 text-xs text-text-2">
          Results are reported as exceptions for human resolution — balances are
          never auto-adjusted (FR-RECON).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {RECONCILERS.map((r) => (
            <button
              key={r.value}
              disabled={busy}
              onClick={() => run(r.value)}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
        </div>
        {msg && (
          <div className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-text-2">
            {msg}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold text-text-2">
          Recent runs
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-2">
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Exceptions</th>
              <th className="px-4 py-2 font-medium">Run by</th>
              <th className="px-4 py-2 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {runsState.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-2">
                  No reconciliation runs yet.
                </td>
              </tr>
            )}
            {runsState.slice(0, 10).map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{r.type}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.status === "failed" ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-text-2">
                  {r.exceptions?.length ?? 0}
                </td>
                <td className="px-4 py-2 text-text-2">{r.createdBy ?? "—"}</td>
                <td className="px-4 py-2 text-text-2">{formatDate(r.startedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold text-text-2">
          Open exceptions ({exceptionsState.length})
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-2">
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Message</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {exceptionsState.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-2">
                  No open exceptions — clean.
                </td>
              </tr>
            )}
            {exceptionsState.slice(0, 10).map((e) => (
              <tr key={e.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEV_TONE[e.severity] ?? "bg-surface-2 text-text-2"}`}>
                    {e.severity}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{e.code}</td>
                <td className="px-4 py-2 text-xs text-text-2">{e.message}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    disabled={busy}
                    onClick={() => resolve(e.id)}
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-text-2 hover:bg-surface-2 disabled:opacity-50"
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
