"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  KycCase,
  KycCaseStatus,
  KycRiskLevel,
  KycStats,
  KycSubjectType,
} from "@/lib/types";
import { StatCard } from "@/components/StatCard";

// Field names and unions here follow api/prisma/schema.prisma and the
// class-validator rules on CreateKycCaseDto / ReviewKycCaseDto. The model now
// has nullable email and sanctions columns (added for P8), but this console
// deliberately collects and displays neither: the email link is PII excluded
// from the list endpoint (invariant 23), and the stored sanctions value is the
// literal 'clear_stub' — rendering it as a screening outcome would violate
// invariant 22. Screening remains a labelled stub.

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  in_review: "bg-brand/15 text-brand",
  approved: "bg-success/15 text-success",
  rejected: "bg-danger/15 text-danger",
};
const RISK_TONE: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-danger/15 text-danger",
  unrated: "bg-surface-2 text-text-2",
};

const EM_DASH = "—";

function Pill({
  value,
  tone,
}: {
  value?: string | null;
  tone: Record<string, string>;
}) {
  if (!value) return <span className="text-text-2">{EM_DASH}</span>;
  const cls = tone[value] ?? "bg-surface-2 text-text-2";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function fmtDate(v?: string | null) {
  if (!v) return EM_DASH;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? EM_DASH : d.toISOString().slice(0, 10);
}

function subjectLabel(t: KycSubjectType) {
  return t === "entity" ? "Entity (KYB)" : "Individual (KYC)";
}

type NewCase = {
  legalName: string;
  subjectType: KycSubjectType;
  country: string;
};

type ReviewState = {
  id: string;
  legalName: string;
  status: KycCaseStatus;
  riskLevel: KycRiskLevel;
  notes: string;
};

const BLANK: NewCase = { legalName: "", subjectType: "person", country: "" };

const inputCls =
  "w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-brand";

export function KycConsole({
  stats,
  cases,
}: {
  stats: KycStats;
  cases: KycCase[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCase, setNewCase] = useState<NewCase>(BLANK);
  const [review, setReview] = useState<ReviewState | null>(null);

  const count = (s: string) =>
    stats.byStatus.find((b) => b.status === s)?.count ?? 0;

  async function createCase(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setNote(null);
    try {
      const res = await fetch("/api/kyc/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newCase),
      });
      if (res.ok) {
        setNewCase(BLANK);
        setShowCreate(false);
        router.refresh();
      } else {
        setMsg(
          res.status === 401 || res.status === 403
            ? "Not authorized. Sign in as an admin or compliance user."
            : "Could not create the case. Check the fields and try again.",
        );
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!review) return;
    setBusy(true);
    setMsg(null);
    setNote(null);
    try {
      const res = await fetch(`/api/kyc/cases/${review.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: review.status,
          riskLevel: review.riskLevel,
          notes: review.notes || undefined,
        }),
      });
      if (res.ok) {
        setReview(null);
        router.refresh();
      } else {
        setMsg(
          res.status === 401 || res.status === 403
            ? "Not authorized. Sign in as an admin or compliance user."
            : "Could not save the review.",
        );
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function screenCase(id: string) {
    setBusy(true);
    setMsg(null);
    setNote(null);
    try {
      const res = await fetch(`/api/kyc/cases/${id}/screen`, {
        method: "POST",
      });
      if (res.ok) {
        // The stub result is not persisted on the case, so surface it here
        // rather than implying a stored screening outcome.
        setNote(
          "Illustrative screening returned “clear”. Deterministic stub only — no provider was contacted.",
        );
        router.refresh();
      } else {
        setMsg(
          res.status === 401 || res.status === 403
            ? "Not authorized. Sign in as an admin or compliance user."
            : "Screening failed.",
        );
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total cases" value={stats.total} />
        <StatCard label="Pending" value={count("pending")} accent="#D5803B" />
        <StatCard
          label="In review"
          value={count("in_review")}
          accent="#2783DE"
        />
        <StatCard label="Approved" value={count("approved")} accent="#46A171" />
        <StatCard label="Rejected" value={count("rejected")} accent="#E56458" />
      </div>

      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-text-2">
        <span className="font-medium text-warning">
          Illustrative screening.
        </span>{" "}
        “Screen” runs a deterministic stub only — no external sanctions / PEP /
        adverse-media provider is contacted, and no screening outcome is stored
        on the case. Live screening stays inactive pending written authorization
        and provider contracts.
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-2">
          Cases ({cases.length})
        </h2>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          {showCreate ? "Close" : "New case"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createCase}
          className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-2"
        >
          <label className="block">
            <span className="mb-1 block text-xs text-text-2">Legal name</span>
            <input
              required
              minLength={2}
              maxLength={120}
              value={newCase.legalName}
              onChange={(e) =>
                setNewCase({ ...newCase, legalName: e.target.value })
              }
              className={inputCls}
              placeholder="Jane Doe / Acme Metals Ltd"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-2">Subject type</span>
            <select
              value={newCase.subjectType}
              onChange={(e) =>
                setNewCase({
                  ...newCase,
                  subjectType: e.target.value as KycSubjectType,
                })
              }
              className={inputCls}
            >
              <option value="person">Individual (KYC)</option>
              <option value="entity">Entity (KYB)</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs text-text-2">Country</span>
            <input
              required
              minLength={2}
              maxLength={56}
              value={newCase.country}
              onChange={(e) =>
                setNewCase({ ...newCase, country: e.target.value })
              }
              className={inputCls}
              placeholder="Singapore"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create case"}
            </button>
          </div>
        </form>
      )}

      {msg && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {msg}
        </div>
      )}

      {note && (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text-2">
          {note}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-2">
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Reviewed by</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-2">
                  No KYC/KYB cases yet.
                </td>
              </tr>
            )}
            {cases.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/60 last:border-0 hover:bg-surface-2/40"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-text">{c.legalName}</div>
                  <div className="text-xs text-text-2">
                    {subjectLabel(c.subjectType)}
                  </div>
                </td>
                <td className="px-4 py-3">{c.country}</td>
                <td className="px-4 py-3">
                  <Pill value={c.status} tone={STATUS_TONE} />
                </td>
                <td className="px-4 py-3">
                  <Pill value={c.riskLevel} tone={RISK_TONE} />
                </td>
                <td className="px-4 py-3 text-text-2">
                  {c.reviewedBy ?? EM_DASH}
                </td>
                <td className="px-4 py-3 text-text-2">
                  {fmtDate(c.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        setReview({
                          id: c.id,
                          legalName: c.legalName,
                          status: c.status,
                          riskLevel: c.riskLevel ?? "unrated",
                          notes: c.notes ?? "",
                        })
                      }
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-text-2 hover:bg-surface-2 hover:text-text"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => screenCase(c.id)}
                      disabled={busy}
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-text-2 hover:bg-surface-2 hover:text-text disabled:opacity-50"
                    >
                      Screen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {review && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !busy && setReview(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Review case</h3>
            <p className="mt-1 text-sm text-text-2">{review.legalName}</p>

            <label className="mt-5 block text-xs text-text-2">Status</label>
            <select
              value={review.status}
              onChange={(e) =>
                setReview({
                  ...review,
                  status: e.target.value as KycCaseStatus,
                })
              }
              className={`mt-1 ${inputCls}`}
            >
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <label className="mt-4 block text-xs text-text-2">Risk level</label>
            <select
              value={review.riskLevel}
              onChange={(e) =>
                setReview({
                  ...review,
                  riskLevel: e.target.value as KycRiskLevel,
                })
              }
              className={`mt-1 ${inputCls}`}
            >
              <option value="unrated">Unrated</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <label className="mt-4 block text-xs text-text-2">Notes</label>
            <textarea
              value={review.notes}
              onChange={(e) => setReview({ ...review, notes: e.target.value })}
              rows={4}
              maxLength={2000}
              className={`mt-1 ${inputCls}`}
              placeholder="Reviewer notes (optional)"
            />

            <p className="mt-3 text-xs text-text-2">
              The decision is recorded against your signed-in account.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setReview(null)}
                disabled={busy}
                className="rounded-md border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={busy}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
