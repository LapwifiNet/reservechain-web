import { ReactNode } from 'react';

/**
 * StatusPanel slot — a set of labelled status cards ("verification / custody /
 * reserve" style, SC-WEB-COPPER/NICKEL status-cards-3 region).
 *
 * Each card shows a title, a Pending-style value (never fabricated — the
 * calling page supplies the copy from its message namespace, and pre-launch
 * that copy is always "pending / proposed / not issued"), and an optional
 * footnote. `children` allows a page to embed a custom panel (e.g. the PoR
 * placeholder dashboard).
 */
export function StatusPanel({
  cards,
  children,
}: {
  cards: Array<{ label: string; value: string; note?: string }>;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
            {c.label}
          </div>
          <div className="mt-2 text-sm font-semibold text-text">{c.value}</div>
          {c.note ? (
            <p className="mt-2 text-xs leading-relaxed text-text2">{c.note}</p>
          ) : null}
        </div>
      ))}
      {children ? <div className="sm:col-span-3">{children}</div> : null}
    </div>
  );
}
