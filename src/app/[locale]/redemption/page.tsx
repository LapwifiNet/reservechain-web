import { InfoPage } from '@/components/InfoPage';
import { Diagram } from '@/components/Diagram';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('redemption');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-REDEEM — the intended process renders as a numbered Diagram slot
 * (inactive banner + process steps from copy). Eligibility stays in the body.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.redemption' });
  const blocks = t.raw('s') as Block[];

  const process = blocks
    .filter((b) => b.h && !b.h.toLowerCase().includes('current status'))
    .map((b, i) => ({ n: String(i + 1), t: b.h, d: b.p }));

  return (
    <InfoPage ns="redemption" notice="proposed">
      <Diagram title="Intended redemption process" steps={process} />
    </InfoPage>
  );
}
