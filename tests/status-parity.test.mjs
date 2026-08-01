import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * D5 status chips: the state machine exists twice and the two copies must not
 * drift.
 *
 * `src/lib/status.ts` renders the chips; `cms/src/lib/statusMachine.ts`
 * enforces the transitions on save. They are separate because `cms/` builds
 * with its own tsconfig and rootDir — importing across the boundary would mean
 * a shared package for three string arrays. The cost of that choice is that a
 * state added to one side and not the other fails silently: the CMS offers a
 * value the website cannot label, and the chip falls back to "Pending" while
 * the admin sees the save succeed. Nothing else in the build catches that.
 *
 * The third check is the one that matters for compliance rather than
 * correctness: every state must have a label in all three locales, because a
 * missing key renders the key path itself — "token.testnet-deployed" on a
 * public page, in one language only.
 *
 * The scales are read out of the source with a regex rather than imported.
 * Importing would drag Next's path aliases (`@/lib/cms`) into a plain node
 * test for the sake of three arrays that are, deliberately, literals.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'src', 'lib', 'status.ts');
const CMS = join(ROOT, 'cms', 'src', 'lib', 'statusMachine.ts');
const MESSAGES = join(ROOT, 'src', 'messages');

const AXES = [
  ['publication', 'PUBLICATION_STATES'],
  ['token', 'TOKEN_STATES'],
  ['asset', 'ASSET_STATES'],
];

/** The string literals of an `export const NAME = [...] as const` array. */
function scale(source, name) {
  const block = new RegExp(`export const ${name} = \\[([^\\]]*)\\]`, 'm').exec(source);
  assert.ok(block, `${name} not found`);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const webSource = readFileSync(WEB, 'utf8');
const cmsSource = readFileSync(CMS, 'utf8');

for (const [axis, constant] of AXES) {
  test(`${axis}: website and CMS declare the same states, in the same order`, () => {
    assert.deepEqual(scale(webSource, constant), scale(cmsSource, constant));
  });
}

test('every state has a label in every locale', () => {
  for (const locale of ['en', 'es', 'it']) {
    const messages = JSON.parse(
      readFileSync(join(MESSAGES, `${locale}.json`), 'utf8'),
    );
    const ns = messages.status;
    assert.ok(ns, `${locale}: no "status" namespace`);
    for (const [axis, constant] of AXES) {
      assert.ok(ns.axis?.[axis], `${locale}: missing status.axis.${axis}`);
      for (const state of scale(webSource, constant)) {
        assert.equal(
          typeof ns[axis]?.[state],
          'string',
          `${locale}: missing status.${axis}.${state}`,
        );
      }
    }
  }
});

test('the token scale cannot express an offer', () => {
  // Guardrails 1 and 6: testnet-only, and never imply tokens are sold, issued
  // or traded. This is the assertion that would fail if someone added the
  // state that seems obviously missing.
  const forbidden = ['issued', 'live', 'tradeable', 'tradable', 'listed', 'mainnet', 'for-sale'];
  for (const state of scale(webSource, 'TOKEN_STATES')) {
    for (const word of forbidden) {
      assert.notEqual(
        state,
        word,
        `token state "${state}" implies an offer or a mainnet deployment`,
      );
    }
  }
});

test('each axis falls back to the first state on its scale', () => {
  // The fallback when the CMS is unreachable must be the reading that claims
  // the least, not the last known one (invariant 29).
  const defaults = /DEFAULT_STATUS: ProjectStatus = \{([^}]*)\}/m.exec(webSource);
  assert.ok(defaults, 'DEFAULT_STATUS not found');
  for (const [axis, constant] of AXES) {
    const declared = new RegExp(`${axis}: '([^']+)'`).exec(defaults[1]);
    assert.ok(declared, `DEFAULT_STATUS missing ${axis}`);
    assert.equal(declared[1], scale(webSource, constant)[0]);
  }
});
