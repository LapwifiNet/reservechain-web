import { PageHeader } from '@/components/PageHeader';
import { Notice } from '@/components/Notice';
import { Diagram } from '@/components/Diagram';
import { Disclosure } from '@/components/Disclosure';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('how-it-works');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-HIW — the seven-step model rendered as a numbered Diagram slot
 * instead of a flat InfoPage. Steps come from the same message namespace
 * (1..N in the copy), so no diagram-specific content was invented.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.how-it-works' });
  const blocks = t.raw('s') as Block[];

  const steps = blocks
    .filter((b) => b.h && b.p)
    .map((b, i) => ({
      n: String(i + 1),
      t: b.h.replace(/^\d+\.\s*/, ''),
      d: b.p,
    }));

  return (
    <div className="mx-auto max-w-content px-5">
      <PageHeader kicker={t('kicker')} title={t('title')} intro={t('intro')}>
        <Notice variant="proposed" />
      </PageHeader>

      <div className="max-w-3xl py-8">
        <Diagram title="Proposed model" steps={steps} />
      </div>

      <div className="py-10">
        <Disclosure variant="full" />
      </div>
    </div>
  );
}
