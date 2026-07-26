import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Locale parity: es.json and it.json must carry exactly the key paths en.json
 * carries.
 *
 * This is the only thing that catches a missing translation key. `next build`
 * cannot: next-intl resolves messages per request, so a key that exists in
 * en.json and not in it.json compiles cleanly and fails in the browser, for
 * Italian users only. The check had been a manual `jq`/`diff` step for seven
 * overlays; a step you have to remember is not a guarantee.
 *
 * Key paths only — never values. A translated string is supposed to differ.
 * Array indices are included, matching `jq 'paths(scalars)'`, so a locale that
 * drops an item from a list (home.trust, page.*.sections) is caught too.
 *
 * Uses node:test so the root package gains no dependency: the pinning trouble
 * in cms/ is a standing reminder that a dependency added for one assertion is
 * still a dependency.
 */

const MESSAGES = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'messages');
const REFERENCE = 'en';
const TRANSLATIONS = ['es', 'it'];

const load = (locale) =>
  JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), 'utf8'));

/** Every path to a scalar leaf, e.g. "nav.home" or "home.trust.0". */
function scalarPaths(value, prefix = '', out = []) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => scalarPaths(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      scalarPaths(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.push(prefix);
  }
  return out;
}

const reference = new Set(scalarPaths(load(REFERENCE)));

test(`${REFERENCE}.json has message keys to compare against`, () => {
  assert.ok(reference.size > 0, `${REFERENCE}.json produced no key paths`);
});

for (const locale of TRANSLATIONS) {
  test(`${locale}.json has the same key paths as ${REFERENCE}.json`, () => {
    const actual = new Set(scalarPaths(load(locale)));

    const missing = [...reference].filter((k) => !actual.has(k)).sort();
    const extra = [...actual].filter((k) => !reference.has(k)).sort();

    const report = [];
    if (missing.length) {
      report.push(
        `${missing.length} key(s) missing from ${locale}.json:\n` +
          missing.map((k) => `    - ${k}`).join('\n'),
      );
    }
    if (extra.length) {
      report.push(
        `${extra.length} key(s) in ${locale}.json with no ${REFERENCE}.json counterpart:\n` +
          extra.map((k) => `    + ${k}`).join('\n'),
      );
    }

    assert.equal(
      missing.length + extra.length,
      0,
      `Locale parity broken.\n  ${report.join('\n  ')}\n` +
        `  Fix by adding the key to src/messages/${locale}.json (translated), ` +
        `not by removing it from ${REFERENCE}.json.`,
    );
  });
}
