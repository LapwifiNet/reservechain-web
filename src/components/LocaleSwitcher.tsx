'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, routing } from '@/i18n/routing';

/** EN / ES / IT switcher that preserves the current route (FR-WEB-3). */
export default function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <div aria-label={t('language')} className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === active ? 'true' : undefined}
          className={`rounded px-1.5 py-1 text-[11px] font-medium uppercase transition ${
            locale === active ? 'bg-surface2 text-text' : 'text-text2 hover:text-text'
          }`}
        >
          {locale}
        </Link>
      ))}
    </div>
  );
}
