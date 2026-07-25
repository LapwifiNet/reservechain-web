import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PageHeader } from '@/components/PageHeader';
import { Notice } from '@/components/Notice';
import { Disclosure } from '@/components/Disclosure';
import { StatusTag } from '@/components/StatusTag';
import { pageMetadata } from '@/lib/meta';
import { registryUnits } from '@/lib/registry';

export const generateMetadata = pageMetadata('registry');

export default function RegistryPage() {
  const t = useTranslations('page.registry');
  const p = useTranslations('program');

  // Columns follow wireframe #3. Every evidence-backed column stays "pending"
  // until the owner supplies documentation (FR-ASSET-3 publication control).
  const columns = [
    'id',
    'program',
    'unit',
    'lab',
    'ownership',
    'custody',
    'valuation',
    'insurance',
    'reserve',
    'token',
    'redemption',
  ] as const;

  return (
    <div className="mx-auto max-w-content px-5">
      <PageHeader kicker={t('kicker')} title={t('title')} intro={t('intro')}>
        <Notice variant="provisional" />
      </PageHeader>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <caption className="sr-only">{t('title')}</caption>
          <thead>
            <tr className="bg-surface2 text-left text-xs uppercase tracking-wide text-text2">
              {columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
                  {t(`col.${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registryUnits.map((u, i) => (
              <tr key={u.id} className={i % 2 ? 'bg-surface/40' : ''}>
                <th scope="row" className="whitespace-nowrap border-t border-border/60 px-4 py-3 text-left font-medium">
                  <Link href={`/passport/${u.id}`} className="text-brand hover:underline">
                    {u.id}
                  </Link>
                </th>
                <td className="whitespace-nowrap border-t border-border/60 px-4 py-3">
                  <span className={u.program === 'copper' ? 'text-copper' : 'text-nickel'}>
                    {p(`${u.program}.kicker`)}
                  </span>
                </td>
                <td className="whitespace-nowrap border-t border-border/60 px-4 py-3 text-text2">
                  {t(`unit.${u.unitKey}`)}
                </td>
                {(['lab', 'ownership', 'custody', 'valuation', 'insurance', 'reserve'] as const).map((c) => (
                  <td key={c} className="whitespace-nowrap border-t border-border/60 px-4 py-3">
                    <StatusTag>{p('v.pending')}</StatusTag>
                  </td>
                ))}
                <td className="whitespace-nowrap border-t border-border/60 px-4 py-3">
                  <StatusTag kind="notissued">{p('v.notIssued')}</StatusTag>
                </td>
                <td className="whitespace-nowrap border-t border-border/60 px-4 py-3">
                  <StatusTag kind="notforsale">{t('v.inactive')}</StatusTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-text2">{t('tableNote')}</p>

      <div className="py-10">
        <Disclosure variant="full" />
      </div>
    </div>
  );
}
