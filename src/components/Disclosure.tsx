import { useTranslations } from 'next-intl';

export function Disclosure({ variant = 'full' }: { variant?: 'full' | 'provisional' }) {
  const t = useTranslations('disclosure');
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-[12px] leading-relaxed text-text2">
      <span className="font-semibold text-danger">{t('label')}:</span>{' '}
      {variant === 'full' ? t('full') : t('provisional')}
    </div>
  );
}
