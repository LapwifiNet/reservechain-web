import { InfoPage } from '@/components/InfoPage';
import { StatusPanel } from '@/components/StatusPanel';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('proof-of-reserves');

/**
 * SC-WEB-POR — Proof of Reserves (inactive, D3). The spec calls for a
 * placeholder dashboard: the page keeps the InfoPage copy and adds a
 * StatusPanel whose values are all "pending / not issued" — never fabricated
 * reserve figures (guardrail CR-5). When PoR is authorised, this panel is the
 * seam where the real dashboard mounts.
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.proof-of-reserves' });

  return (
    <InfoPage ns="proof-of-reserves" notice="proposed">
      <StatusPanel
        cards={[
          { label: t('dash.reserve.label'), value: t('dash.reserve.value'), note: t('dash.reserve.note') },
          { label: t('dash.supply.label'), value: t('dash.supply.value'), note: t('dash.supply.note') },
          { label: t('dash.coverage.label'), value: t('dash.coverage.value'), note: t('dash.coverage.note') },
        ]}
      />
    </InfoPage>
  );
}
