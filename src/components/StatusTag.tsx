const map: Record<string, string> = {
  pending: 'border-border text-text2',
  notissued: 'border-danger/50 text-danger bg-danger/10',
  notforsale: 'border-danger/50 text-danger bg-danger/10',
  illustrative: 'border-warn/50 text-warn bg-warn/10',
};
export function StatusTag({ kind, children }: { kind?: string; children: React.ReactNode }) {
  const cls = map[(kind || 'pending').replace(/[^a-z]/g, '')] || map.pending;
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${cls}`}>{children}</span>;
}
