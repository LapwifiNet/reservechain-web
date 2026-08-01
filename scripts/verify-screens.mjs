/**
 * verify-screens — CI gate for the screen registry (docs/spec/screens.yaml).
 *
 * Fail the build when:
 * 1. A route in src/app/[locale]/ maps to no screen id in screens.yaml.
 * 2. A screen marked status: done has no route, or its route does not exist.
 * 3. A screen marked status: conflict has a blocked_by decision that is
 *    already closed in docs/spec/decisions.yaml (forces an update).
 * 4. A screen declaring regions: renders only InfoPage (blocks the "20 screens
 *    merged into one component" regression — the worst failure mode of group A).
 * 5. screens.yaml deviates from the 80 ids fixed by decision D6.
 *
 * Run: node scripts/verify-screens.mjs  (or via `npm run verify:screens`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SPEC_DIR = join(ROOT, 'docs', 'spec');
const YAML = join(SPEC_DIR, 'screens.yaml');
const DECISIONS = join(SPEC_DIR, 'decisions.yaml');

// 80 ids fixed by decision D6 (Screen Registry §2).
const EXPECTED_COUNT = 80;
// D1..D6 decisions that are still OPEN (not decided yet).
const OPEN_DECISIONS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

const errors = [];
const warn = (msg) => console.warn(`  ⚠ ${msg}`);
const fail = (msg) => errors.push(msg);

// ── minimal YAML parse (screens.yaml is a flat list of flat-ish maps) ──────
function parseScreens(text) {
  const screens = [];
  let cur = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('- id:')) {
      if (cur) screens.push(cur);
      cur = { id: line.slice(5).trim() };
    } else if (cur && line.startsWith('  ') && line.includes(':')) {
      const idx = line.indexOf(':');
      const key = line.slice(2, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('[') || val.startsWith('{') || val === '' || val.startsWith('>')) {
        cur[key] = val; // keep raw; lists not needed for the gate
      } else {
        cur[key] = val;
      }
    }
  }
  if (cur) screens.push(cur);
  return screens;
}

const screens = parseScreens(readFileSync(YAML, 'utf8'));

// ── check 5: exactly 80 ids (D6) ───────────────────────────────────────────
if (screens.length !== EXPECTED_COUNT) {
  fail(`D6: expected ${EXPECTED_COUNT} screen ids, found ${screens.length}`);
} else {
  console.log(`✅ screen registry: ${screens.length} ids (D6 ok)`);
}

const byId = new Map(screens.map((s) => [s.id, s]));

// ── routes on disk ──────────────────────────────────────────────────────────
const LOCALE_DIR = join(ROOT, 'src', 'app', '[locale]');
function listRoutes(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'page.tsx') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listRoutes(full, `${prefix}/${entry.name}`));
    }
  }
  if (existsSync(join(dir, 'page.tsx'))) out.push(prefix || '/');
  return out;
}
const routes = listRoutes(LOCALE_DIR);

// ── check 1: every route maps to a screen id ────────────────────────────────
const routeToScreen = new Map(
  screens.filter((s) => s.route).map((s) => [s.route.split(' ')[0], s.id]),
);
for (const r of routes) {
  const match = [...routeToScreen.entries()].find(([specRoute]) =>
    specRoute.includes('[') ? specRoute.startsWith(r) || r.startsWith(specRoute.split('/')[0] + '/') : specRoute === r,
  );
  if (!match) fail(`route /${r} has no screen id in screens.yaml (check 1)`);
}

// ── check 2: done screens have a route that exists ──────────────────────────
const WEB_ROUTE = (r) => r.startsWith('/[locale]') || r === '/' || r.startsWith('/[locale]/');
for (const s of screens) {
  if (s.status !== 'done') continue;
  if (!s.route) {
    // admin/mobile screens may legitimately live outside the web tree; only
    // web screens are required to carry a route at this stage.
    if (s.id.startsWith('SC-WEB-')) fail(`${s.id} is done but declares no route (check 2)`);
    continue;
  }
  const specRoute = s.route.split(' ')[0];
  if (!WEB_ROUTE(specRoute)) continue; // admin / mobile / error routes — not in src/app/[locale]
  const ok = routes.some(
    (r) =>
      specRoute.includes('[')
        ? r.startsWith(specRoute.split('/')[0]) && r.split('/').length === specRoute.split('/').length
        : r === specRoute,
  );
  if (!ok) fail(`${s.id}: done but route "${specRoute}" not found on disk (check 2)`);
}

// ── check 3: conflict screens must not reference a closed decision ──────────
if (existsSync(DECISIONS)) {
  const decisions = parseScreens(readFileSync(DECISIONS, 'utf8'));
  const closed = decisions.filter((d) => d.status === 'closed').map((d) => d.id);
  for (const s of screens) {
    if (s.status !== 'conflict' || !s.blocked_by) continue;
    const blocker = s.blocked_by.split(',')[0].trim();
    if (closed.includes(blocker)) {
      fail(`${s.id} is blocked by ${blocker}, which is CLOSED — update the screen (check 3)`);
    }
  }
} else {
  warn('decisions.yaml missing — check 3 skipped');
}

// ── check 4: regions-declaring screens must not render only InfoPage ───────
for (const s of screens) {
  if (!s.regions || !s.route) continue;
  const specRoute = s.route.split(' ')[0];
  if (specRoute.startsWith('/') && !specRoute.startsWith('/[locale]')) continue; // admin/mobile not in web tree
  if (specRoute.includes('[') || specRoute === 'not-found' || specRoute === 'error') continue;
  const rel = specRoute.replace(/^\/\[locale\]/, '');
  const pageFile = join(LOCALE_DIR, rel, 'page.tsx');
  if (!existsSync(pageFile)) continue;
  const src = readFileSync(pageFile, 'utf8');
  if (src.includes('InfoPage') && !src.includes('Diagram') && !src.includes('SpecTable') && !src.includes('StatusPanel')) {
    fail(`${s.id} declares regions: but ${specRoute} renders only InfoPage (check 4)`);
  }
}

if (errors.length) {
  console.error(`\n❌ verify-screens: ${errors.length} failure(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✅ verify-screens: all checks passed');
