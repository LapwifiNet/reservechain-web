import { ReactNode } from 'react';

export function PageHeader({
  kicker,
  title,
  intro,
  children,
}: {
  kicker?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-border pb-8 pt-14">
      {kicker ? (
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">{kicker}</div>
      ) : null}
      <h1 className="serif mt-3 max-w-3xl text-3xl leading-tight sm:text-4xl">{title}</h1>
      {intro ? <p className="mt-4 max-w-2xl text-text2">{intro}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
