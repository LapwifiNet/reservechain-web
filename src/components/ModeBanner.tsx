import { useTranslations } from 'next-intl';
import { siteMode, siteModeLabel, type SiteMode } from '@/lib/mode';

/**
 * Mode banner — FR-MODE / D4.
 *
 * Rendered in the locale layout. Shows only when the deployment is in a
 * non-prelaunch mode, so a `development` or `waitlist` deployment can be told
 * apart from the honest pre-launch state at a glance, without changing any
 * content semantics. The prelaunch mode renders nothing — that is the state
 * the site should normally be in.
 */
export function ModeBanner() {
  const t = useTranslations('mode');
  const mode = siteMode();

  if (mode === 'prelaunch') return null;

  const copy =
    mode === 'development'
      ? t('development')
      : mode === 'waitlist'
        ? t('waitlist')
        : t('other', { mode: siteModeLabel(mode as SiteMode) });

  return (
    <div
      role="status"
      className="bg-amber-100 text-amber-950 border-b border-amber-300 px-4 py-2 text-center text-[12px] font-medium"
    >
      {t('label', { mode: siteModeLabel(mode as SiteMode) })} — {copy}
    </div>
  );
}
