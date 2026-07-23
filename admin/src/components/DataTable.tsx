import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  if (!rows || rows.length === 0) {
    return <EmptyState message={empty ?? "No records yet."} />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-2">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 font-medium ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/60 last:border-0 hover:bg-surface-2/40"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 ${c.align === "right" ? "text-right tabular-nums" : ""}`}
                >
                  {c.render ? c.render(row) : String(row[c.key] ?? "\u2014")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
