export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-text-2">
      {message}
    </div>
  );
}
