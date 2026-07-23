import { useTranslations } from 'next-intl';
import { Disclosure } from '@/components/Disclosure';
import { SpecTable } from '@/components/SpecTable';
import { StatusTag } from '@/components/StatusTag';

export default function NickelWire() {
  const t = useTranslations('program');
  return (
    <div className="mx-auto max-w-content px-5 py-12">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nickel">{t('nickel.kicker')}</div>
      <h1 className="serif mt-2 text-4xl">{t('nickel.title')}</h1>
      <div className="mt-5"><Disclosure variant="provisional" /></div>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text2">{t('specs')}</h2>
          <SpecTable rows={[
            { k: t('f.material'), v: 'Nickel Wire (DKRNT NP1)' },
            { k: t('f.purity'), v: <>99.9807% <StatusTag kind="illustrative">{t('tag.illustrative')}</StatusTag></> },
            { k: t('f.diameter'), v: '0.025mm' },
            { k: t('f.coa'), v: t('v.pendingVerification') },
            { k: t('f.weight'), v: t('v.pending') },
            { k: t('f.storage'), v: t('v.pendingCustody') },
          ]} />
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text2">{t('status')}</h2>
          <SpecTable rows={[
            { k: t('s.lab'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.ownership'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.custody'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.tokenization'), v: <StatusTag kind="notissued">{t('v.notIssued')}</StatusTag> },
            { k: t('s.availability'), v: <StatusTag kind="notforsale">{t('v.notForSale')}</StatusTag> },
          ]} />
        </div>
      </div>
    </div>
  );
}
