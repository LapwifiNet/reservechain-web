import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routing } from '../src/i18n/routing';

/**
 * axe-core against every static route, in every locale, failing on any WCAG
 * 2.0/2.1 A or AA violation.
 *
 * The route list is read off the file tree rather than hardcoded. The overlay
 * shipped a hardcoded `["", "/programs", "/waitlist", "/investor"]`; two of
 * those four routes do not exist on this site, so half the suite asserted
 * against a 404 page. A list derived from `src/app/[locale]` cannot drift: a
 * page added without an accessible name is caught the day it lands.
 *
 * Locales come from `routing.locales`, not a second copy of the list — ES and
 * IT strings run 15–25% longer than EN and change reading order, which is
 * exactly where a heading-order or contrast-on-wrap defect appears.
 */

const APP_DIR = join(__dirname, '..', 'src', 'app', '[locale]');

/** Every static route under `[locale]`, as a locale-relative path. */
function staticRoutes(dir = APP_DIR, prefix = ''): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'page.tsx') {
      routes.push(prefix);
      continue;
    }
    if (!statSync(full).isDirectory()) continue;
    // `[slug]` needs a CMS document to resolve; it has no static instance to
    // scan, so it is out of scope here rather than silently asserted against
    // a not-found page.
    if (entry.startsWith('[') || entry.startsWith('_')) continue;
    routes.push(...staticRoutes(full, `${prefix}/${entry}`));
  }
  return routes.sort();
}

const ROUTES = staticRoutes();
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('the route list is non-empty', () => {
  expect(ROUTES.length).toBeGreaterThan(0);
});

for (const locale of routing.locales) {
  for (const route of ROUTES) {
    const path = `/${locale}${route}`;
    test(`a11y ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `${path} should not 404`).toBe(200);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      const summary = results.violations
        .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n${v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n')}`)
        .join('\n    ');

      expect(results.violations, `${path}\n    ${summary}`).toEqual([]);
    });
  }
}
