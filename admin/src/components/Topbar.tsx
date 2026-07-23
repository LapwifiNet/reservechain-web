import { api } from "@/lib/api";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-canvas/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="font-semibold md:hidden">ReserveChain Admin</span>
        <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs text-brand">
          Environment: Sepolia Testnet
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-2">
        <span className="hidden sm:inline">API: {api.base}</span>
        <span className="rounded-full bg-warning/15 px-2.5 py-1 text-warning">
          Sensitive modules inactive
        </span>
      </div>
    </header>
  );
}
