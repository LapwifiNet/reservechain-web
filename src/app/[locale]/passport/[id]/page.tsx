import { useTranslations } from 'next-intl';
import { Disclosure } from '@/components/Disclosure';
import { SpecTable } from '@/components/SpecTable';
import { StatusTag } from '@/components/StatusTag';

// Params convention: take `params` whole and read fields in the body, never
// destructure it in the signature — Next 15+ passes a Promise, so the upgrade
// is then a one-line `const { id } = await params;` here (which also means this
// component must become async and swap useTranslations for getTranslations).
export default function Passport({ params }: { params: { id: string } }) {
  const t = useTranslations('passport');
  const { id } = params;
  return (
    <div className="mx-auto max-w-content px-5 py-12">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">{t('kicker')} · {id}</div>
      <h1 className="serif mt-2 text-3xl">Copper Powder — Unit {id}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusTag>{t('tag.reservePending')}</StatusTag>
        <StatusTag kind="notissued">{t('tag.tokenNotIssued')}</StatusTag>
        <StatusTag>{t('tag.custodyPending')}</StatusTag>
      </div>
      <div className="mt-5"><Disclosure variant="provisional" /></div>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text2">{t('details')}</h2>
          <SpecTable rows={[
            { k: t('f.material'), v: 'Copper Powder' },
            { k: t('f.program'), v: 'Copper Powder Program' },
            { k: t('f.purity'), v: <StatusTag kind="illustrative">{t('tag.illustrative')}</StatusTag> },
            { k: t('f.lot'), v: <StatusTag kind="illustrative">{t('tag.illustrative')}</StatusTag> },
            { k: t('f.weight'), v: t('v.pending') },
            { k: t('f.lab'), v: t('v.pending') },
            { k: t('f.ownership'), v: t('v.pending') },
            { k: t('f.valuation'), v: t('v.pending') },
            { k: t('f.insurance'), v: t('v.pending') },
            { k: t('f.availability'), v: <StatusTag kind="notforsale">{t('v.notForSale')}</StatusTag> },
          ]} />
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text2">{t('reserve')}</h2>
          <SpecTable rows={[
            { k: t('s.custody'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.reserve'), v: <StatusTag>{t('v.pending')}</StatusTag> },
            { k: t('s.tokenization'), v: <StatusTag kind="notissued">{t('v.notIssued')}</StatusTag> },
            { k: t('s.contract'), v: t('v.notDeployed') },
            { k: t('s.image'), v: t('v.pendingPhoto') },
          ]} />
          <p className="mt-4 text-xs text-text2">{t('docsNote')}</p>
        </div>
      </div>
    </div>
  );
}
