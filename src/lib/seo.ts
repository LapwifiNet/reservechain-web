import { routing } from '@/i18n/routing';
import { NON_INDEXABLE_ROUTES } from '@/lib/routes';

/**
 * Canonical origin of the site, or null when it is not configured.
 *
 * There is deliberately no default. The overlay this replaces fell back to
 * `https://openrwa.example` — a domain this project has not deployed and does
 * not control — which would have emitted canonical tags, hreflang alternates,
 * Open Graph URLs and a sitemap host all pointing at it. A wrong canonical is
 * worse than a missing one: it tells a crawler the real page lives elsewhere.
 * Unset means the tags are omitted, which is the honest state.
 *
 * NEXT_PUBLIC_ because it is inlined at build time and is genuinely public —
 * it is the address of the site itself.
 */
export function siteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

/**
 * Whether crawlers may index this deployment.
 *
 * Defaults to **false**. The site says on every page that it is in
 * development and that no tokens are offered or sold; a preview or staging
 * deployment that quietly invites indexing publishes that state to search
 * results and to anyone who later searches the brand. Turning it on is a
 * deliberate act: set SITE_INDEXABLE=true on the production deployment only.
 *
 * Server-side only — this decides what robots.txt says, and the browser has no
 * business reading it.
 */
export function indexingEnabled(): boolean {
  return process.env.SITE_INDEXABLE === 'true';
}

/** True when `route` must stay out of an index even on a public deployment. */
export function isIndexableRoute(route: string): boolean {
  return !NON_INDEXABLE_ROUTES.some((r) => route === r || route.startsWith(`${r}/`));
}

/**
 * Canonical URL plus hreflang alternates for one locale-relative route.
 *
 * Returns undefined when the origin is unconfigured, so the caller spreads
 * nothing rather than emitting a relative or invented canonical.
 */
export function alternatesFor(route: string) {
  const origin = siteUrl();
  if (!origin) return undefined;

  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${origin}/${locale}${route}`;
  }
  languages['x-default'] = `${origin}/${routing.defaultLocale}${route}`;

  return (locale: string) => ({
    canonical: `${origin}/${locale}${route}`,
    languages,
  });
}

/**
 * The `robots` metadata for one route: noindex unless this deployment is
 * explicitly indexable *and* the route is one that belongs in an index.
 */
export function robotsFor(route: string) {
  const allowed = indexingEnabled() && isIndexableRoute(route);
  return allowed
    ? { index: true, follow: true }
    : { index: false, follow: false };
}
