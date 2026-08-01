import { InfoPage } from '@/components/InfoPage';
import { TimelineList } from '@/components/TimelineList';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('custody');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-CUSTODY — the custody model rendered as a TimelineList slot instead
 * of a flat InfoPage. Items come from the same message namespace; the
 * "Current status" block stays in the InfoPage body where it belongs.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.custody' });
  const blocks = t.raw('s') as Block[];

  const timeline = blocks
    .filter((b) => b.h && !b.h.toLowerCase().includes('current status'))
    .map((b) => ({ t: b.h, d: b.p }));

  return (
    <InfoPage ns="custody" notice="proposed">
      <TimelineList title="Intended custody timeline" items={timeline} />
    </InfoPage>
  );
}
