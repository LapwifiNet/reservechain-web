export function GatedNotice({
  title,
  code,
  description,
  phase,
}: {
  title: string;
  code: number;
  description: string;
  phase: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-warning">
          <span>\ud83d\udee1\ufe0f</span>
          <span>Module inactive \u00b7 HTTP {code}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-2">
          {description}
        </p>
        <div className="mt-4 text-xs text-text-2">
          Planned in <span className="text-text">{phase}</span>. Requires
          written authorization from the issuer before activation.
        </div>
      </div>
    </div>
  );
}
