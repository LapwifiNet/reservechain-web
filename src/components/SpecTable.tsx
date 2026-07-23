export function SpecTable({ rows }: { rows: Array<{ k: string; v: React.ReactNode }> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 ? 'bg-surface/40' : ''}>
              <td className="border-b border-border/60 px-4 py-2.5 text-text2">{r.k}</td>
              <td className="border-b border-border/60 px-4 py-2.5 text-right font-medium">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
