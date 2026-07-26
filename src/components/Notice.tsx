import { useTranslations } from 'next-intl';

/**
 * Neutral-language notices required by the brief's content rules.
 * `provisional` is the verbatim CR-4 asset notice; `draft` marks legal and
 * policy documents that have not yet been through counsel review, so nothing
 * on the site reads as final or operational (CR-1 / CR-2).
 */
export function Notice({ variant }: { variant: 'provisional' | 'draft' | 'proposed' }) {
  const t = useTranslations('notice');
  const tone =
    variant === 'draft'
      ? 'border-warn/40 bg-warn/5 text-text2'
      : variant === 'proposed'
        ? 'border-brand/40 bg-brand/5 text-text2'
        : 'border-warn/40 bg-warn/5 text-text2';
  const label = variant === 'draft' ? t('draftLabel') : variant === 'proposed' ? t('proposedLabel') : t('provisionalLabel');
  const body = variant === 'draft' ? t('draft') : variant === 'proposed' ? t('proposed') : t('provisional');
  return (
    <div className={`rounded-lg border px-4 py-3 text-[12px] leading-relaxed ${tone}`}>
      <span className="font-semibold text-text">{label}:</span> {body}
    </div>
  );
}
