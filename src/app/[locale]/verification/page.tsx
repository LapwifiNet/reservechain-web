import { InfoPage } from '@/components/InfoPage';
import { TimelineList } from '@/components/TimelineList';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('verification');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-VERIF — verification framework as a TimelineList slot. Same copy
 * namespace; the "Current status" block stays in the InfoPage body.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.verification' });
  const blocks = t.raw('s') as Block[];

  const timeline = blocks
    .filter((b) => b.h && !b.h.toLowerCase().includes('current status'))
    .map((b) => ({ t: b.h, d: b.p }));

  return (
    <InfoPage ns="verification" notice="proposed">
      <TimelineList title="Verification framework" items={timeline} />
    </InfoPage>
  );
}
