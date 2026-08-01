import { InfoPage } from '@/components/InfoPage';
import { TimelineList } from '@/components/TimelineList';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('legal-structure');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-LEGAL — corporate / asset-holding / token classification rendered as
 * a TimelineList slot. The "no regulatory authorization" and current-status
 * blocks stay in the InfoPage body where the warning belongs.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.legal-structure' });
  const blocks = t.raw('s') as Block[];

  const items = blocks
    .filter(
      (b) =>
        b.h &&
        !b.h.toLowerCase().includes('current status') &&
        !b.h.toLowerCase().includes('no regulatory'),
    )
    .map((b) => ({ t: b.h, d: b.p }));

  return (
    <InfoPage ns="legal-structure" notice="proposed">
      <TimelineList title="Legal & asset-holding structure" items={items} />
    </InfoPage>
  );
}
