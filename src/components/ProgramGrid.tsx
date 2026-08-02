import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { StatusTag } from './StatusTag';
import { metalLabelKey, stageLabelKey, stageTone } from '@/lib/programs';
import type { ProgramSummary } from '@/lib/cms';

/**
 * ProgramGrid slot — the published asset programs on SC-WEB-ASSETS.
 *
 * The caller fetches (`listPrograms()`); this component only renders. No CMS
 * value reaches JSX directly: `src/lib/programs.ts` maps `stage` and `metal` to
 * message keys, so the page shows reviewed copy in three locales and an enum
 * the website has never heard of still renders as "Illustrative" rather than as
 * a key path. The CMS's own admin labels are not reused — `active` reads as
 * "Active" to an editor and "In preparation" to a visitor, because nothing here
 * is being offered (guardrails 1, 6).
 *
 * An empty array is the normal path, not an edge case: `listPrograms()` returns
 * [] whenever the CMS is unreachable, so the empty state is also what a visitor
 * sees during a CMS outage. It states a fact — no published programs — and
 * promises nothing about later ones.
 *
 * `purity` and `summary` are optional in the collection, so a card without them
 * is valid and must not leave a dangling label behind.
 */

/**
 * Programs whose slug already has a page on disk. A whitelist, not a
 * `/programs/${slug}` pattern: no per-program route exists, and the two that do
 * are hand-built pages (`status: conflict, blocked_by: D2`). A program seeded
 * tomorrow would otherwise render a link to a 404.
 */
const PROGRAM_ROUTES: Record<string, string> = {
  'copper-powder': '/copper-powder',
  'nickel-wire': '/nickel-wire',
};

export function ProgramGrid({ programs }: { programs: ProgramSummary[] }) {
  const t = useTranslations('page.industrial-metal-assets.grid');

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
        {t('heading')}
      </h2>

      {programs.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-text2">{t('empty')}</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {programs.map((p) => {
            const route = PROGRAM_ROUTES[p.slug];
            const card = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="serif text-lg text-text">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-text2">
                      {t(metalLabelKey(p.metal))}
                    </p>
                  </div>
                  <StatusTag kind={stageTone(p.stage)}>
                    {t(stageLabelKey(p.stage))}
                  </StatusTag>
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text2">
                  <div className="flex gap-1.5">
                    <dt>{t('code')}</dt>
                    <dd className="text-text">{p.code}</dd>
                  </div>
                  {p.purity ? (
                    <div className="flex gap-1.5">
                      <dt>{t('purity')}</dt>
                      <dd className="text-text">{p.purity}</dd>
                    </div>
                  ) : null}
                </dl>
                {p.summary ? (
                  <p className="mt-3 text-sm leading-relaxed text-text2">
                    {p.summary}
                  </p>
                ) : null}
              </>
            );

            return (
              <li key={p.slug}>
                {route ? (
                  <Link
                    href={route}
                    className="block h-full rounded-lg border border-border bg-surface p-5 transition hover:border-copper"
                  >
                    {card}
                  </Link>
                ) : (
                  <div className="h-full rounded-lg border border-border bg-surface p-5">
                    {card}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
