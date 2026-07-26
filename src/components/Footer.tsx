import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Disclosure } from './Disclosure';
import { mainNav, companyNav, engageNav, legalNav } from '@/lib/nav';

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">{title}</div>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

export default function Footer() {
  const t = useTranslations('footer');
  const n = useTranslations('nav');
  const platform = mainNav[0].items;
  const assets = mainNav[1].items;

  return (
    <footer className="mt-20 border-t border-border bg-ink">
      <div className="mx-auto max-w-content px-5 py-12">
        <div className="mb-10">
          <Disclosure variant="full" />
        </div>

        <div className="grid gap-8 text-sm text-text2 sm:grid-cols-2 lg:grid-cols-4">
          <Column title={n('group.platform')}>
            {platform.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-text">
                  {n(i.key)}
                </Link>
              </li>
            ))}
          </Column>

          <Column title={n('group.assets')}>
            {assets.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-text">
                  {n(i.key)}
                </Link>
              </li>
            ))}
          </Column>

          <Column title={t('company')}>
            {companyNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-text">
                  {n(i.key)}
                </Link>
              </li>
            ))}
          </Column>

          <Column title={t('engage')}>
            {engageNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-text">
                  {n(i.key)}
                </Link>
              </li>
            ))}
          </Column>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">{t('legal')}</div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text2">
            {legalNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-text">
                  {n(i.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-text2 sm:flex-row">
          <span>
            Reserve<span className="text-copper">Chain</span>.io — {t('tagline')}
          </span>
          <span>{t('rights')}</span>
        </div>
      </div>
    </footer>
  );
}
