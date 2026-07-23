import type { CSSProperties } from "react";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  const style: CSSProperties | undefined = accent
    ? { color: accent }
    : undefined;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-wide text-text-2">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums" style={style}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-text-2">{sub}</div>}
    </div>
  );
}
