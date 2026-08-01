import { ReactNode } from 'react';

/**
 * TimelineList slot — a vertical milestone timeline for custody / verification
 * style pages (SC-WEB-CUSTODY timeline region, SC-WEB-VERIF lab-card region).
 *
 * Each item: a title, optional body, optional date/status label. `children`
 * lets a page embed custom content (warehouse cards, lab panels) after the
 * timeline.
 */
export function TimelineList({
  title,
  items,
  children,
}: {
  title?: string;
  items: Array<{ t: string; d?: string; label?: string }>;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-6 sm:p-8">
      {title ? <h2 className="serif text-lg text-text">{title}</h2> : null}
      <ol className="mt-6 space-y-0">
        {items.map((it, i) => (
          <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
            {/* rail */}
            {i < items.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[11px] top-7 h-full w-px bg-border"
              />
            ) : null}
            <span className="relative mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-copper/40 bg-canvas">
              <span className="h-2 w-2 rounded-full bg-copper" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="text-sm font-medium text-text">{it.t}</div>
                {it.label ? (
                  <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-medium text-copper">
                    {it.label}
                  </span>
                ) : null}
              </div>
              {it.d ? (
                <p className="mt-1 text-sm leading-relaxed text-text2">{it.d}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
