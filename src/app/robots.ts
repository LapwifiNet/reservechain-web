import type { MetadataRoute } from 'next';
import { NON_INDEXABLE_ROUTES } from '@/lib/routes';
import { indexingEnabled, siteUrl } from '@/lib/seo';

/**
 * robots.txt.
 *
 * Before this file the site shipped no robots.txt at all, which is not
 * neutral: absent robots.txt means "index everything". A site that states on
 * every page that it is in development, with a waitlist and an investor
 * portal, was fully open to crawlers by default.
 *
 * So the default here is deny. `SITE_INDEXABLE=true` opts a deployment in, and
 * even then the portal routes stay out and the sitemap is only advertised when
 * an origin is configured to put in it.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl();

  if (!indexingEnabled()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api', ...NON_INDEXABLE_ROUTES.map((r) => `/*${r}`)],
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml`, host: origin } : {}),
  };
}
