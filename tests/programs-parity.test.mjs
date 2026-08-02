import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * SC-WEB-ASSETS program grid: the stage and metal enums exist twice and the two
 * copies must not drift.
 *
 * `cms/src/collections/AssetPrograms.ts` decides what an editor can save;
 * `src/lib/programs.ts` decides what a visitor reads. They are separate for the
 * same reason the D5 state machine is (see status-parity): `cms/` builds with
 * its own tsconfig and rootDir, and a shared package for two string arrays is
 * not worth the pinning trouble.
 *
 * The failure this catches is quiet by construction. `coerceStage` falls back
 * to `illustrative` for anything it does not know, which is the right behaviour
 * on a public page and also means a value added to the CMS and not here renders
 * as "Illustrative" forever, with the save succeeding and nothing logged. The
 * fallback protects the visitor; this test protects the editor.
 *
 * The locale check is the compliance half: a stage with no label in one locale
 * would render the key path itself — "stage.not_for_sale" on a public page, in
 * Italian only.
 *
 * Both sides are read out of the source with a regex rather than imported.
 * Importing `src/lib/programs.ts` would drag Next's path aliases into a plain
 * node test, and the CMS side is a Payload config that cannot be loaded without
 * a database.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'src', 'lib', 'programs.ts');
const CMS = join(ROOT, 'cms', 'src', 'collections', 'AssetPrograms.ts');
const MESSAGES = join(ROOT, 'src', 'messages');
const NS = ['page', 'industrial-metal-assets', 'grid'];

/** The string literals of an `export const NAME = [...] as const` array. */
function webEnum(source, name) {
  const block = new RegExp(`export const ${name} = \\[([^\\]]*)\\]`, 'm').exec(source);
  assert.ok(block, `${name} not found in src/lib/programs.ts`);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** The `value:` entries of the named select field in the Payload collection. */
function cmsEnum(source, field) {
  const at = source.indexOf(`name: "${field}"`);
  assert.ok(at !== -1, `field ${field} not found in AssetPrograms.ts`);
  const open = source.indexOf('options: [', at);
  assert.ok(open !== -1, `field ${field} has no options list`);
  const close = source.indexOf(']', open);
  return [...source.slice(open, close).matchAll(/value: "([^"]+)"/g)].map((m) => m[1]);
}

const webSource = readFileSync(WEB, 'utf8');
const cmsSource = readFileSync(CMS, 'utf8');

for (const [field, constant] of [
  ['stage', 'PROGRAM_STAGES'],
  ['metal', 'PROGRAM_METALS'],
]) {
  test(`${field}: website and CMS declare the same values`, () => {
    assert.deepEqual(
      [...webEnum(webSource, constant)].sort(),
      [...cmsEnum(cmsSource, field)].sort(),
    );
  });
}

test('every stage and metal has a label in every locale', () => {
  const stages = webEnum(webSource, 'PROGRAM_STAGES');
  const metals = webEnum(webSource, 'PROGRAM_METALS');

  for (const locale of ['en', 'es', 'it']) {
    const messages = JSON.parse(
      readFileSync(join(MESSAGES, `${locale}.json`), 'utf8'),
    );
    const grid = NS.reduce((node, key) => {
      assert.ok(node?.[key], `${locale}: missing ${NS.join('.')}`);
      return node[key];
    }, messages);

    for (const key of ['heading', 'empty', 'code', 'purity']) {
      assert.ok(grid[key], `${locale}: grid.${key} is missing`);
    }
    for (const stage of stages) {
      assert.ok(grid.stage?.[stage], `${locale}: grid.stage.${stage} is missing`);
    }
    for (const metal of metals) {
      assert.ok(grid.metals?.[metal], `${locale}: grid.metals.${metal} is missing`);
    }
  }
});

test('an unknown stage falls back to the reading that claims the least', () => {
  // The fallback is what keeps a future CMS value off the page as itself.
  // Asserted on the source so it cannot be relaxed without this test noticing.
  assert.match(
    webSource,
    /: 'illustrative';/,
    'coerceStage must fall back to illustrative',
  );
  assert.match(webSource, /: 'other';/, 'coerceMetal must fall back to other');
});
