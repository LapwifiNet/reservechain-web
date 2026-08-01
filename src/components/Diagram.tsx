import { ReactNode } from 'react';

/**
 * Diagram slot — a labelled visual panel for process/architecture content.
 * Part of the InfoPage composition (Screen Registry step 2): pages that need
 * a diagram declare it as a slot instead of rendering a flat InfoPage.
 *
 * `steps` renders a numbered vertical process; `children` lets a page render
 * anything custom (SVG, cards, embedded media) inside the panel.
 */
export function Diagram({
  title,
  steps,
  children,
}: {
  title?: string;
  steps?: Array<{ n: string; t: string; d?: string }>;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-6 sm:p-8">
      {title ? (
        <h2 className="serif text-lg text-text">{title}</h2>
      ) : null}
      {steps ? (
        <ol className="mt-6 space-y-5">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-copper/15 text-sm font-semibold text-copper">
                {s.n}
              </span>
              <div>
                <div className="text-sm font-medium text-text">{s.t}</div>
                {s.d ? <p className="mt-1 text-sm leading-relaxed text-text2">{s.d}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
