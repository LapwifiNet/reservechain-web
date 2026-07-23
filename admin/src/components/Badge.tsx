const map: Record<string, string> = {
  issued: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  registered: "bg-brand/15 text-brand",
  draft: "bg-text-2/15 text-text-2",
  inactive: "bg-warning/15 text-warning",
  pending: "bg-warning/15 text-warning",
};

export function Badge({ children }: { children: string }) {
  const key = typeof children === "string" ? children.toLowerCase() : "";
  const cls = map[key] ?? "bg-surface-2 text-text-2";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}
    >
      {children}
    </span>
  );
}
