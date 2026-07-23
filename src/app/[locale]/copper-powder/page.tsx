import { useTranslations } from 'next-intl';
import { Disclosure } from '@/components/Disclosure';
import { SpecTable } from '@/components/SpecTable';
import { StatusTag } from '@/components/StatusTag';

export default function CopperPowder() {
  const t = useTranslations('program');
  return (
    <div className="mx-auto max-w-content px-5 py-12">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">{t('copper.kicker')}</div>
      <h1 className="serif mt-2 text-4xl">{t('copper.title')}</h1>
      <div className="mt-5"><Disclosure variant="provisional" /></div>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text2">{t('specs')}</h2>
          <SpecTable rows={[
            { k: t('f.material'), v: 'Copper Powder' },
            { k: t('f.purity'), v: <>99.9999% <StatusTag kind="illustrative">{t('tag.illustrative')}</StatusTag></> },
            { k: t('f.coa'), v: t('v.pending') },
            { k: t('f.weight'), v: t('v.pendingVerification') },
            { k: t('f.packaging'), v: 'IGAS 0004512' },
            { k: t('f.storage'), v: t('v.pendingCustody') },
          ]} />
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text2">{t('status')}</h2>
          <SpecTable rows={[
            { k: t('s.lab'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.ownership'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.custody'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.valuation'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.reserve'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.tokenization'), v: <StatusTag kind="notissued">{t('v.notIssued')}</StatusTag> },
            { k: t('s.availability'), v: <StatusTag kind="notforsale">{t('v.notForSale')}</StatusTag> },
          ]} />
        </div>
      </div>
    </div>
  );
}
