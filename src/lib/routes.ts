/**
 * Every static, locale-relative route the public site serves.
 *
 * Checked in rather than derived, because the two consumers cannot both read
 * the file tree: `sitemap.ts` may be evaluated in a standalone server image
 * where `src/app` is not present. `tests/routes-parity.test.mjs` asserts this
 * list against the tree on every `npm test`, so a page added or removed
 * without touching this file fails immediately instead of quietly dropping out
 * of the sitemap and the accessibility scan.
 *
 * `/passports/[slug]` is deliberately absent: it resolves only against a
 * published CMS document, so it has no static instance to list.
 */
export const STATIC_ROUTES = [
  '',
  '/about',
  '/anti-fraud',
  '/asset-owner-enquiries',
  '/contact',
  '/cookie',
  '/copper-powder',
  '/corporate-status',
  '/custody',
  '/documents',
  '/enterprise',
  '/faq',
  '/governance',
  '/how-it-works',
  '/industrial-buyer-enquiries',
  '/industrial-metal-assets',
  '/legal-structure',
  '/nickel-wire',
  '/official-channels',
  '/passports',
  '/portal',
  '/portal/login',
  '/portal/register',
  '/privacy',
  '/proof-of-reserves',
  '/redemption',
  '/registry',
  '/restricted-jurisdictions',
  '/risk-disclosure',
  '/roadmap',
  '/terms',
  '/tokenization',
  '/verification',
  '/waitlist',
] as const;

/**
 * Routes that must never be advertised to a crawler even once the site is
 * indexable: the investor portal is an authentication surface, and its
 * sign-in and registration pages have no informational value in an index.
 */
export const NON_INDEXABLE_ROUTES: readonly string[] = [
  '/portal',
  '/portal/login',
  '/portal/register',
];
