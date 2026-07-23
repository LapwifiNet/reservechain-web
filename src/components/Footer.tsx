import { useTranslations } from 'next-intl';
import { Disclosure } from './Disclosure';

export default function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="mt-20 border-t border-border bg-ink">
      <div className="mx-auto max-w-content px-5 py-10">
        <div className="mb-6"><Disclosure variant="full" /></div>
        <div className="flex flex-col justify-between gap-3 text-xs text-text2 sm:flex-row">
          <span>Reserve<span className="text-copper">Chain</span>.io — {t('tagline')}</span>
          <span>{t('rights')}</span>
        </div>
      </div>
    </footer>
  );
}
