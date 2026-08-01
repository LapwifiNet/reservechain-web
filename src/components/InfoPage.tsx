import { useTranslations } from 'next-intl';
import { PageHeader } from './PageHeader';
import { Notice } from './Notice';
import { Disclosure } from './Disclosure';
import { ReactNode } from 'react';

type Block = { h: string; p: string; li?: string[] };

/**
 * Content-driven page renderer. Every informational and legal page reads its
 * copy from the `page.<ns>` message namespace so the same structure can later
 * be fed by the CMS without touching route files.
 *
 * `notice` renders the mandated pre-approval banner for the page type, and
 * long-form pages stay inside the 680-760px measure from the design system.
 *
 * Since the Screen Registry pass (step 2), this component is a *composition
 * base*: `children` render after the content blocks, so a page can declare
 * slots (Diagram / TimelineList / SpecTable / StatusPanel / EnquiryForm)
 * without abandoning the shared header, notice and disclosure. Pages that
 * still render only InfoPage are exactly the ones `verify:screens` check 4
 * flags — add a slot, don't fork the layout.
 */
export function InfoPage({
  ns,
  notice,
  narrow = false,
  children,
}: {
  ns: string;
  notice?: 'provisional' | 'draft' | 'proposed';
  narrow?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations(`page.${ns}`);
  const blocks = t.raw('s') as Block[];
  return (
    <div className="mx-auto max-w-content px-5">
      <PageHeader kicker={t('kicker')} title={t('title')} intro={t('intro')}>
        {notice ? <Notice variant={notice} /> : null}
      </PageHeader>

      <div className={narrow ? 'max-w-[720px]' : 'max-w-3xl'}>
        {blocks.map((b, i) => (
          <section key={i} className="border-b border-border/50 py-8 last:border-b-0">
            <h2 className="serif text-xl">{b.h}</h2>
            <p className="mt-3 text-sm leading-relaxed text-text2">{b.p}</p>
            {b.li?.length ? (
              <ul className="mt-4 space-y-2">
                {b.li.map((item, j) => (
                  <li key={j} className="flex gap-3 text-sm text-text2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {children ? <div className="py-8">{children}</div> : null}
      </div>

      <div className="py-10">
        <Disclosure variant="full" />
      </div>
    </div>
  );
}
