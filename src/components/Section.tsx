import { ReactNode } from 'react';

/**
 * Anchored content section. `id` is used by the home page so the 22 brief
 * sections are individually linkable, and by in-page tables of contents.
 */
export function Section({
  id,
  kicker,
  title,
  subtitle,
  children,
}: {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-10">
      {kicker ? (
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">{kicker}</div>
      ) : null}
      {title ? <h2 className="serif mt-2 text-2xl">{title}</h2> : null}
      {subtitle ? <p className="mt-2 max-w-2xl text-sm text-text2">{subtitle}</p> : null}
      {children ? <div className={title || kicker ? 'mt-6' : ''}>{children}</div> : null}
    </section>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      {title ? <h3 className="font-medium">{title}</h3> : null}
      <div className={title ? 'mt-2 text-sm text-text2' : 'text-sm text-text2'}>{children}</div>
    </div>
  );
}

export function CardGrid({ cols = 3, children }: { cols?: 2 | 3; children: ReactNode }) {
  return (
    <div className={`grid gap-4 ${cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>{children}</div>
  );
}
