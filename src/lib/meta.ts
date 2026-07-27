import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { alternatesFor, robotsFor, siteUrl } from '@/lib/seo';

/**
 * Per-page SEO metadata sourced from the same message namespace the page
 * renders from, so title/description never drift from visible copy (FR-WEB-3).
 *
 * The canonical path is derived from the namespace because every one of the
 * 26 call sites passes a namespace equal to its route segment
 * (`pageMetadata('registry')` on `/registry`); `routeFor` overrides that for
 * anything nested. Deriving it keeps this the single place page metadata is
 * built — the SEO overlay shipped a parallel `buildMetadata()` helper, and two
 * mechanisms for one rule means half the pages silently keep the older one.
 */
export function pageMetadata(ns: string, routeFor?: string) {
  const route = routeFor ?? `/${ns}`;
  return async function generateMetadata(props: { params: { locale: string } }): Promise<Metadata> {
    const { locale } = props.params;
    const t = await getTranslations({ locale, namespace: `page.${ns}` });
    return {
      title: `${t('title')} | ReserveChain.io`,
      description: t('intro'),
      ...routeMetadata(route, locale),
    };
  };
}

/**
 * Canonical, hreflang and robots for one locale-relative route.
 *
 * Also used directly by the seven pages whose title and description do not
 * come from a `page.*` namespace — the home page, the two program pages, the
 * waitlist and the three portal pages. Without it those emitted no canonical
 * at all, so `/en/waitlist` and `/it/waitlist` looked to a crawler like two
 * unrelated pages carrying the same layout metadata.
 */
export function routeMetadata(route: string, locale: string): Metadata {
  const origin = siteUrl();
  const alternates = alternatesFor(route);
  return {
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    ...(alternates ? { alternates: alternates(locale) } : {}),
    robots: robotsFor(route),
  };
}
