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
 * The second check below is on ICU argument names, which is the one thing
 * about a *value* that must not be translated: `{count}` renamed to `{cuenta}`
 * throws at render time in that locale only. Key parity cannot see it.
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

/**
 * ICU argument parity.
 *
 * A translator who renames `{count}` to `{cuenta}`, or drops it, produces a
 * file that parses, passes key parity, and throws `IntlError: MISSING_VALUE`
 * the moment a Spanish visitor loads the page. Argument names are code, not
 * copy.
 *
 * Names only, and as a set — order and surrounding text are exactly what a
 * translator is supposed to change. Matches simple `{name}` arguments and the
 * leading argument of `{count, plural, ...}` / `{kind, select, ...}` forms,
 * including any nested inside a branch.
 *
 * This is the only check adopted from the i18n-QA overlay. Its other
 * mechanical proposals were not:
 *
 *   - key parity, both directions — already the test above.
 *   - "no ES/IT value may equal its EN value" — would flag the prelaunch
 *     disclosure, which is frozen content that must stay verbatim, plus the
 *     brand, `Legal`, `Whitepaper`, `Metal` and `Token`. It reports correct
 *     translations as defects.
 *   - "figures stay identical across locales" — ES and IT correctly write
 *     99,9999% with a decimal comma. It reports correct localisation as a
 *     defect.
 */
const ICU_ARGUMENT = /\{\s*([A-Za-z0-9_]+)\s*[,}]/g;

/** The set of ICU argument names in a message, or an empty set for non-strings. */
function icuArguments(value) {
  if (typeof value !== 'string') return new Set();
  return new Set([...value.matchAll(ICU_ARGUMENT)].map((m) => m[1]));
}

/** Every [path, value] pair for a scalar leaf. */
function scalarEntries(value, prefix = '', out = []) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => scalarEntries(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      scalarEntries(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.push([prefix, value]);
  }
  return out;
}

const referenceEntries = scalarEntries(load(REFERENCE));

for (const locale of TRANSLATIONS) {
  test(`${locale}.json uses the same ICU arguments as ${REFERENCE}.json`, () => {
    const actual = new Map(scalarEntries(load(locale)));

    const mismatches = [];
    for (const [path, value] of referenceEntries) {
      if (!actual.has(path)) continue; // key parity above owns that failure
      const expected = icuArguments(value);
      const found = icuArguments(actual.get(path));
      const missing = [...expected].filter((a) => !found.has(a));
      const unknown = [...found].filter((a) => !expected.has(a));
      if (missing.length || unknown.length) {
        mismatches.push(
          `    - ${path}` +
            (missing.length ? `\n        missing: ${missing.map((a) => `{${a}}`).join(', ')}` : '') +
            (unknown.length ? `\n        not in ${REFERENCE}: ${unknown.map((a) => `{${a}}`).join(', ')}` : ''),
        );
      }
    }

    assert.equal(
      mismatches.length,
      0,
      `ICU arguments differ from ${REFERENCE}.json in ${mismatches.length} message(s):\n` +
        `${mismatches.join('\n')}\n` +
        `  Argument names are not translated — {count} stays {count} in every locale.`,
    );
  });
}
