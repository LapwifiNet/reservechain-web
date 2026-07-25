import { useTranslations } from 'next-intl';
import { Button } from '@/components/Button';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="mx-auto max-w-content px-5 py-24 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">404</div>
      <h1 className="serif mt-3 text-3xl">{t('title')}</h1>
      <p className="mx-auto mt-4 max-w-md text-text2">{t('body')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">{t('home')}</Button>
        <Button href="/documents" variant="ghost">
          {t('documents')}
        </Button>
      </div>
    </div>
  );
}
