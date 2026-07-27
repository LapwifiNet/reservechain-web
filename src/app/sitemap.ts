import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { STATIC_ROUTES } from '@/lib/routes';
import { indexingEnabled, isIndexableRoute, siteUrl } from '@/lib/seo';

/**
 * sitemap.xml.
 *
 * Empty unless the deployment is both indexable and has a configured origin —
 * a sitemap is a set of absolute URLs, so without an origin there is nothing
 * truthful to emit, and listing pages a robots.txt forbids is a contradiction
 * a crawler will report.
 *
 * Routes come from `STATIC_ROUTES`, which `tests/routes-parity.test.mjs` holds
 * against the file tree. The overlay this replaces hardcoded `["", "/programs",
 * "/waitlist"]` and then appended `/programs/<slug>` for every slug returned by
 * `GET {CMS}/asset-programs/public`. Neither `/programs` nor that CMS endpoint
 * exists: the sitemap would have advertised a 404 as its highest-priority page
 * after the home page, in all three locales.
 *
 * No `lastModified`. `new Date()` at build time claims every page changed on
 * every deploy, which is worse than saying nothing — a crawler that believes
 * it recrawls unchanged pages, and one that stops believing it ignores the
 * field on the pages that did change. There is no per-page mtime to use here
 * that survives a checkout.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  if (!origin || !indexingEnabled()) return [];

  const entries: MetadataRoute.Sitemap = [];
  for (const route of STATIC_ROUTES) {
    if (!isIndexableRoute(route)) continue;

    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = `${origin}/${locale}${route}`;
    }

    for (const locale of routing.locales) {
      entries.push({
        url: `${origin}/${locale}${route}`,
        changeFrequency: 'monthly',
        priority: route === '' ? 1 : 0.7,
        alternates: { languages },
      });
    }
  }
  return entries;
}
