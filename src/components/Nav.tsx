import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Nav() {
  const t = useTranslations('nav');
  const items: Array<[string, string]> = [
    ['/', t('home')],
    ['/copper-powder', t('copper')],
    ['/nickel-wire', t('nickel')],
    ['/passport/DAP-0001', t('passport')],
    ['/waitlist', t('waitlist')],
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-3.5">
        <Link href="/" className="font-semibold tracking-tight">Reserve<span className="text-copper">Chain</span>.io</Link>
        <nav className="hidden items-center gap-5 text-sm text-text2 md:flex">
          {items.slice(0, 4).map(([h, label]) => (
            <Link key={h} href={h} className="hover:text-text">{label}</Link>
          ))}
        </nav>
        <Link href="/waitlist" className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white hover:brightness-110">
          {t('cta')}
        </Link>
      </div>
    </header>
  );
}
