import { InfoPage } from '@/components/InfoPage';
import { StatusChips } from '@/components/StatusChips';
import { TimelineList } from '@/components/TimelineList';
import { pageMetadata } from '@/lib/meta';
import { projectStatusFromCms } from '@/lib/status';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('roadmap');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-ROADMAP — the five stages render as a TimelineList slot. Copy comes
 * from the same message namespace; no invented milestones.
 *
 * The D5 chips render above the timeline: a roadmap read on its own invites
 * the reader to guess how far along it is, and the chips answer that from CMS
 * state instead of leaving it to inference.
 */
export const revalidate = 300;

export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.roadmap' });
  const blocks = t.raw('s') as Block[];
  const status = await projectStatusFromCms();

  const items = blocks
    .filter((b) => b.h && b.p)
    .map((b) => ({ t: b.h, d: b.p }));

  return (
    <InfoPage ns="roadmap">
      <StatusChips status={status} />
      <TimelineList title="Roadmap" items={items} />
    </InfoPage>
  );
}
