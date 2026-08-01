import { InfoPage } from '@/components/InfoPage';
import { TimelineList } from '@/components/TimelineList';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('roadmap');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-ROADMAP — the five stages render as a TimelineList slot. Copy comes
 * from the same message namespace; no invented milestones.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.roadmap' });
  const blocks = t.raw('s') as Block[];

  const items = blocks
    .filter((b) => b.h && b.p)
    .map((b) => ({ t: b.h, d: b.p }));

  return (
    <InfoPage ns="roadmap">
      <TimelineList title="Roadmap" items={items} />
    </InfoPage>
  );
}
