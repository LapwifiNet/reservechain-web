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
 *
 * ---------------------------------------------------------------------------
 * Why the route matching below looks pedantic
 *
 * The first version of this gate branched on `specRoute.includes('[')` to
 * decide between an exact comparison and a looser dynamic-segment comparison.
 * Every web route in screens.yaml begins with `/[locale]`, so that condition
 * was true for all of them, always. Checks 1, 2 and 4 therefore took their
 * wildcard path for every single web screen, and that path compared segment
 * counts rather than segment names — or, in check 4, skipped the screen
 * outright. Four of the five checks were inert and the gate printed
 * "all checks passed".
 *
 * It was found by accident: screens.yaml declared SC-WEB-COOKIE at
 * `/[locale]/cookie-policy` with `status: done` while the directory on disk is
 * `src/app/[locale]/cookie`. That is precisely the drift this file exists to
 * catch, it had been in the registry since the mirror landed, and the gate was
 * green the whole time.
 *
 * The fix is to strip the `/[locale]` prefix once, up front, and then compare
 * routes as exact strings against the directory tree. A dynamic segment then
 * matches by name — `[slug]` equals `[slug]` and nothing else — because the
 * directory tree spells dynamic segments the same way the registry does. No
 * check may branch on the presence of a bracket again.
 *
 * A silent pass is what let this survive, so every check now reports what it
 * actually inspected. A gate that cannot say what it looked at is not evidence.
 * ---------------------------------------------------------------------------
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

// Slot components that satisfy check 4. A page composed from any of these is
// no longer "just an InfoPage". Keep in sync with the composition work in §5 of
// the reconciliation page.
const SLOT_COMPONENTS = [
  'Diagram',
  'TimelineList',
  'SpecTable',
  'StatusPanel',
  'EnquiryForm',
  'FaqAccordion',
  'StatusChips',
];

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
      const val = line.slice(idx + 1).trim();
      // Only record the first occurrence of a key, so continuation lines of a
      // folded block (gap: >, note: >) cannot overwrite it.
      if (!(key in cur)) cur[key] = val;
    }
  }
  if (cur) screens.push(cur);
  return screens;
}

const screens = parseScreens(readFileSync(YAML, 'utf8'));

// ── check 5: exactly 80 ids (D6) ──────────────────────────────────
if (screens.length !== EXPECTED_COUNT) {
  fail(`D6: expected ${EXPECTED_COUNT} screen ids, found ${screens.length}`);
} else {
  console.log(`✅ check 5: screen registry has ${screens.length} ids (D6 ok)`);
}

// ── routes on disk ──────────────────────────────────────────────
const LOCALE_DIR = join(ROOT, 'src', 'app', '[locale]');
function listRoutes(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      out.push(...listRoutes(join(dir, entry.name), `${prefix}/${entry.name}`));
    }
  }
  if (existsSync(join(dir, 'page.tsx'))) out.push(prefix || '/');
  return out;
}
const routes = listRoutes(LOCALE_DIR);
const routeSet = new Set(routes);

/**
 * Turn a registry route into the path it must occupy under src/app/[locale]/.
 *
 * Returns null for anything that does not live in the web tree — admin and
 * mobile screens, and the special `not-found` / `error` entries. Those are out
 * of scope for a check that walks src/app/[locale]/, and saying so explicitly
 * is the point: a null here means "not applicable", never "matches".
 */
const LOCALE_PREFIX = '/[locale]';
function toDiskRoute(rawRoute) {
  if (!rawRoute) return null;
  const route = rawRoute.split(' ')[0];
  if (route === LOCALE_PREFIX) return '/';
  if (!route.startsWith(`${LOCALE_PREFIX}/`)) return null;
  return route.slice(LOCALE_PREFIX.length);
}

// ── check 1: every route on disk maps to a screen id ─────────────────────
const diskRouteToScreen = new Map();
for (const s of screens) {
  const disk = toDiskRoute(s.route);
  if (disk === null) continue;
  if (diskRouteToScreen.has(disk)) {
    fail(`route ${disk} is claimed by both ${diskRouteToScreen.get(disk)} and ${s.id} (check 1)`);
  } else {
    diskRouteToScreen.set(disk, s.id);
  }
}
let unmapped = 0;
for (const r of routes) {
  if (!diskRouteToScreen.has(r)) {
    fail(`route /[locale]${r === '/' ? '' : r} exists on disk but no screen id in screens.yaml claims it (check 1)`);
    unmapped += 1;
  }
}
if (!unmapped) {
  console.log(`✅ check 1: ${routes.length} routes on disk, all claimed by a screen id`);
}

// ── check 2: done screens have a route that exists ───────────────────────
let doneWebChecked = 0;
let doneBroken = 0;
for (const s of screens) {
  if (s.status !== 'done') continue;
  if (!s.route) {
    // admin/mobile screens may legitimately live outside the web tree; only
    // web screens are required to carry a route at this stage.
    if (s.id.startsWith('SC-WEB-')) {
      fail(`${s.id} is done but declares no route (check 2)`);
      doneBroken += 1;
    }
    continue;
  }
  const disk = toDiskRoute(s.route);
  if (disk === null) continue; // admin / mobile / not-found / error
  doneWebChecked += 1;
  if (!routeSet.has(disk)) {
    fail(`${s.id}: done, but "${s.route.split(' ')[0]}" has no page.tsx on disk (check 2)`);
    doneBroken += 1;
  }
}
if (!doneBroken) {
  console.log(`✅ check 2: ${doneWebChecked} done web screens, every route present on disk`);
}

// ── check 3: conflict screens must not reference a closed decision ──────────
if (existsSync(DECISIONS)) {
  const decisions = parseScreens(readFileSync(DECISIONS, 'utf8'));
  const closed = decisions.filter((d) => d.status === 'closed').map((d) => d.id);
  const known = new Set(decisions.map((d) => d.id));
  let conflicts = 0;
  let stale = 0;
  for (const s of screens) {
    if (!s.blocked_by) continue;
    const blocker = s.blocked_by.split(',')[0].trim();
    if (!known.has(blocker)) {
      fail(`${s.id} is blocked_by ${blocker}, which is not in decisions.yaml (check 3)`);
      stale += 1;
      continue;
    }
    conflicts += 1;
    // Deliberately not limited to status: conflict. A screen left at missing or
    // partial while its blocker is closed is the same stale state, and the
    // earlier version only inspected conflict screens — so the ten investor and
    // mobile screens sitting at `missing, blocked_by: D3` were never examined.
    if (closed.includes(blocker)) {
      fail(`${s.id} is blocked by ${blocker}, which is CLOSED — update the screen (check 3)`);
      stale += 1;
    }
  }
  if (!stale) {
    console.log(`✅ check 3: ${conflicts} blocked screens, none waiting on a closed decision`);
  }
} else {
  warn('decisions.yaml missing — check 3 skipped');
}

// ── check 4: regions-declaring screens must not render only InfoPage ───────
let regionsChecked = 0;
let flattened = 0;
for (const s of screens) {
  if (!s.regions) continue;
  const disk = toDiskRoute(s.route);
  if (disk === null) continue; // admin / mobile / not-found / error
  const pageFile = join(LOCALE_DIR, disk === '/' ? '' : disk, 'page.tsx');
  if (!existsSync(pageFile)) continue; // check 2 owns missing routes
  regionsChecked += 1;
  const src = readFileSync(pageFile, 'utf8');
  if (src.includes('InfoPage') && !SLOT_COMPONENTS.some((c) => src.includes(c))) {
    fail(`${s.id} declares regions: but /[locale]${disk} renders only InfoPage (check 4)`);
    flattened += 1;
  }
}
if (!flattened) {
  console.log(`✅ check 4: ${regionsChecked} screens declare regions, none collapsed into a bare InfoPage`);
}

if (errors.length) {
  console.error(`\n❌ verify-screens: ${errors.length} failure(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✅ verify-screens: all checks passed');
