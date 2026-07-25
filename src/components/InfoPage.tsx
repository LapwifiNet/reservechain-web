import { useTranslations } from 'next-intl';
import { PageHeader } from './PageHeader';
import { Notice } from './Notice';
import { Disclosure } from './Disclosure';

type Block = { h: string; p: string; li?: string[] };

/**
 * Content-driven page renderer. Every informational and legal page reads its
 * copy from the `page.<ns>` message namespace so the same structure can later
 * be fed by the CMS without touching route files.
 *
 * `notice` renders the mandated pre-approval banner for the page type, and
 * long-form pages stay inside the 680-760px measure from the design system.
 */
export function InfoPage({
  ns,
  notice,
  narrow = false,
}: {
  ns: string;
  notice?: 'provisional' | 'draft' | 'proposed';
  narrow?: boolean;
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
      </div>

      <div className="py-10">
        <Disclosure variant="full" />
      </div>
    </div>
  );
}
