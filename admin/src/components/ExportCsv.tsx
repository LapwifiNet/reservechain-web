"use client";

import { useState } from "react";

/**
 * Client-side CSV export for admin tables. Generates the file from data the
 * page already holds (server-fetched), so no extra API surface is needed.
 *
 * PII note: staff pages render emails masked, but CSV export emits the full
 * address — that is the point of an ops export, and only roles that can
 * already read the underlying rows reach these pages.
 */
export function ExportCsv({
  filename,
  columns,
  rows,
  label = "Export CSV",
}: {
  filename: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  function download() {
    setBusy(true);
    try {
      const esc = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const head = columns.map((c) => esc(c.label)).join(",");
      const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(","));
      const csv = [head, ...body].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy || rows.length === 0}
      className="rounded-md border border-border px-3 py-1.5 text-xs text-text-2 hover:bg-surface-2 hover:text-text disabled:opacity-40"
    >
      {busy ? "Preparing…" : label}
    </button>
  );
}
