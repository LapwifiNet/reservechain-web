export function BarList({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-text-2">No data.</div>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="capitalize">{it.label}</span>
            <span className="tabular-nums text-text-2">{it.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
