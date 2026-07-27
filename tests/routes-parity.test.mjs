import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * `src/lib/routes.ts` must list exactly the static routes that exist.
 *
 * The sitemap and the accessibility scan both read that list, and neither can
 * read the file tree itself — the sitemap because a standalone server image
 * has no `src/app`, the scan because it should fail on a missing page rather
 * than silently scan fewer of them. So the list is checked in, and this test
 * is what stops it going stale: add a page without adding it here and `npm
 * test` fails, instead of the page never appearing in the sitemap.
 *
 * Reads the TypeScript source as text — the root package has no build step for
 * tests and gains no dependency from this file, matching i18n-parity.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src', 'app', '[locale]');

/** Every static route under `[locale]`, as a locale-relative path. */
function routesOnDisk(dir = APP_DIR, prefix = '') {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'page.tsx') {
      routes.push(prefix);
      continue;
    }
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    // `[slug]` has no static instance; `_` prefixes are private folders.
    if (entry.startsWith('[') || entry.startsWith('_')) continue;
    routes.push(...routesOnDisk(full, `${prefix}/${entry}`));
  }
  return routes;
}

/** The string literals inside the STATIC_ROUTES array, in source order. */
function declaredRoutes() {
  const source = readFileSync(join(ROOT, 'src', 'lib', 'routes.ts'), 'utf8');
  const block = source.match(/export const STATIC_ROUTES = \[([\s\S]*?)\] as const;/);
  assert.ok(block, 'STATIC_ROUTES array not found in src/lib/routes.ts');
  return [...block[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

test('STATIC_ROUTES lists exactly the static routes on disk', () => {
  const onDisk = routesOnDisk().sort();
  const declared = declaredRoutes();
  const sorted = [...declared].sort();

  const missing = onDisk.filter((r) => !declared.includes(r));
  const extra = declared.filter((r) => !onDisk.includes(r));

  const report = [];
  if (missing.length) report.push(`not listed: ${missing.map((r) => r || '/').join(', ')}`);
  if (extra.length) report.push(`listed but absent: ${extra.map((r) => r || '/').join(', ')}`);

  assert.equal(
    missing.length + extra.length,
    0,
    `src/lib/routes.ts is out of date.\n  ${report.join('\n  ')}\n` +
      '  Fix by editing STATIC_ROUTES, not by deleting this test — the sitemap ' +
      'and the a11y scan both read that list.',
  );
  assert.deepEqual(declared, sorted, 'keep STATIC_ROUTES sorted so diffs stay readable');
});

test('NON_INDEXABLE_ROUTES only names routes that exist', () => {
  const source = readFileSync(join(ROOT, 'src', 'lib', 'routes.ts'), 'utf8');
  const block = source.match(
    /export const NON_INDEXABLE_ROUTES: readonly string\[\] = \[([\s\S]*?)\];/,
  );
  assert.ok(block, 'NON_INDEXABLE_ROUTES array not found');
  const declared = [...block[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  const onDisk = routesOnDisk();
  const unknown = declared.filter((r) => !onDisk.includes(r));
  assert.deepEqual(unknown, [], `NON_INDEXABLE_ROUTES names routes that do not exist: ${unknown}`);
});
