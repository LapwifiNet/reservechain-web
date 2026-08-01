import { InfoPage } from '@/components/InfoPage';
import { FaqAccordion } from '@/components/FaqAccordion';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('faq');

type Block = { h: string; p: string; li?: string[] };

export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.faq' });
  const blocks = t.raw('s') as Block[];
  const qa = blocks
    .filter((b) => b.h && b.p)
    .map((b) => ({ q: b.h, a: b.p }));

  return (
    <InfoPage ns="faq">
      <FaqAccordion qa={qa} />
    </InfoPage>
  );
}
