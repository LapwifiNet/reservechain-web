import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Per-page SEO metadata sourced from the same message namespace the page
 * renders from, so title/description never drift from visible copy (FR-WEB-3).
 */
export function pageMetadata(ns: string) {
  return async function generateMetadata(props: { params: { locale: string } }): Promise<Metadata> {
    const { locale } = props.params;
    const t = await getTranslations({ locale, namespace: `page.${ns}` });
    return {
      title: `${t('title')} | ReserveChain.io`,
      description: t('intro'),
    };
  };
}
