import { useTranslations } from 'next-intl';

/**
 * Bypass block (WCAG 2.4.1). The nav carries ~30 links before the content
 * starts, so a keyboard or screen-reader user otherwise tabs through all of
 * them on every page.
 *
 * axe cannot catch the absence of this — its `bypass` rule is satisfied by the
 * landmarks alone — which is exactly why it is here rather than left to the
 * automated suite.
 *
 * Off-screen until focused, never `display: none`: a hidden element is not
 * focusable, and a skip link that cannot be reached is decoration.
 */
export default function SkipLink() {
  const t = useTranslations('a11y');
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg bg-copperDeep px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      {t('skipToContent')}
    </a>
  );
}
