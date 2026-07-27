# Accessibility

Target: **WCAG 2.1 AA** on the public website (`src/`). The admin console, the
CMS admin UI and the mobile app are out of scope for the automated suite.

## Status

The automated suite passes. As of the commit that introduced it:

```
103 passed (45.6s)
```

That is 34 static routes × 3 locales, plus a guard that the route list is
non-empty. It was **not** green when the suite was written — see
[What it found](#what-it-found).

## Running it

```bash
npm ci
npx playwright install chromium     # ~366 MB, once per machine
npm run build                       # the suite serves the build, not dev
PORT=3100 npm run test:a11y
```

`PORT` matters. `docker compose up` publishes the web container on 3000, so a
run that defaults to 3000 while compose is up scans the **container image**,
not your working tree — silently, and the numbers look plausible. Use a port
compose does not own, or point at a deployment:

```bash
BASE_URL=https://some-deployment npm run test:a11y
```

### Why it is not in CI

It needs a browser download and a running site. Wiring it as a required check
would create a gate that fails for reasons unrelated to the change under
review, on a repository where Actions has never run. It is a local script
(`npm run test:a11y`) and nothing triggers it automatically. `npm test` is
unaffected — that stays `node --test tests/*.test.mjs`, no browser, no server.

The dependency cost of `npm ci` alone is **21 MB** of `node_modules`
(`@playwright/test`, `playwright-core`, `@axe-core/playwright`, `axe-core`).
Neither package declares an install script, so **`npm ci` downloads no
browser**; the 366 MB Chromium arrives only when you run `playwright install`
explicitly.

## What it covers

Every static route under `src/app/[locale]`, in `en`, `es` and `it`. The route
list is read off the file tree at run time rather than hardcoded, so a page
added without an accessible name is caught the day it lands.

Included, among the 34: `/`, `/waitlist`, `/passports`, `/registry`,
`/portal`, `/portal/login`, `/portal/register`, `/proof-of-reserves`,
`/redemption`, and the 24 InfoPage-templated policy and explainer routes.

Not covered:

- `/passports/[slug]` — needs a published CMS document to resolve. There is no
  static instance to scan, so it is out of scope rather than silently asserted
  against a not-found page.
- Anything behind investor authentication. `/portal` renders its signed-out
  state; the signed-in dashboard is not scanned.
- The three locales are scanned at one viewport (1280×720). ES and IT strings
  run 15–25% longer than EN, so wrap-dependent defects at narrow widths are a
  manual check, below.

Rules: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`. Any violation fails.

## What it found

Four rules, on the site as it stood. All four were real; none were suppressed.

| Rule | Impact | Scope | Cause | Fix |
| --- | --- | --- | --- | --- |
| `color-contrast` | serious | 102/102 pages | White text on `copper #C0703B` = **3.73:1** (needs 4.5). Also `nickel #6B7785` on canvas = 4.14, and one raw `text-neutral-500` = 3.98 | Added a `copperDeep #A85C2B` token for solid fills carrying white text (4.96:1); lightened `nickel` to `#8792A1`; replaced the raw grey with the `text2` token |
| `label` | **critical** | 9/102 | The portal sign-in and registration `<label>` elements were rendered but never associated with an input — three unnamed edit boxes to a screen reader | `htmlFor`/`id` on all three, plus `aria-describedby` for the password hint |
| `link-in-text-block` | serious | 9/102 | "Create account" was distinguished from surrounding text by colour alone, at 1.61:1 against it | Underlined unconditionally instead of on hover |
| `scrollable-region-focusable` | serious | 3/102 | The registry table scrolls horizontally; a keyboard-only user could not reach the overflowing columns | `tabIndex={0}` + `role="region"` + a label, with a visible focus ring |

`copper` itself was **not** darkened: at `#C0703B` on canvas it is 5.06:1 and
passes as text. No single shade satisfies both white-on-copper and
copper-on-canvas, so the two roles need two tokens.

### A defect the suite surfaced indirectly

With the CMS unreachable, the first render of `/passports` blocked for **over
90 seconds** before falling through to its empty state. The `try/catch` in
`src/lib/cms.ts` looked like graceful degradation but had no deadline: Next's
data cache retries underneath `next: { revalidate }`, and that path also
ignores `signal`, so an `AbortSignal` did not bound it. Racing the promise
against a timer returned fast but left the losing fetch to reject afterwards,
inside the request scope, which tore the response stream — a fast 200 with a
truncated body, worse than the hang. Taking the call out of that layer
(`cache: 'no-store'`, page-level `revalidate = 300` unchanged) puts the
rejection back in the catch where it belongs. Now 0.04–0.4s and the page still
prerenders. Fixed separately from the suite.

## Manual checks the suite cannot make

axe catches roughly a third of WCAG AA. These are not automatable and are not
claimed to be done:

### Perceivable
- [ ] Meaningful images have `alt`; decorative images use `alt=""`.
- [ ] Status is never conveyed by colour alone (copper/nickel, ok/warn/danger).
- [ ] Content reflows at 320px and 200% zoom without loss — check ES and IT,
      where nav labels and buttons are longest.

### Operable
- [ ] Full keyboard operability; logical tab order; no keyboard traps.
- [ ] Visible focus indicator on every interactive element.
- [ ] The Nav dropdowns and the waitlist stepper are operable by keyboard.
- [ ] The skip link reaches `#main-content` and is visible when focused.

### Understandable
- [ ] `<html lang>` matches the active locale (automated coverage exists via
      the locale layout, but confirm on a locale switch).
- [ ] Waitlist and portal errors are announced, not only shown.
- [ ] Navigation and naming stay consistent across locales.

### Robust
- [ ] Single `<h1>` per page; heading levels not skipped.
- [ ] Landmarks present: `header`, `nav`, `main`, `footer`.

### Screen readers
- [ ] VoiceOver (Safari/macOS) and NVDA (Firefox/Windows) on home, waitlist,
      registry, portal sign-in.

## Rules

- A violation is fixed or explained in the same change. A suppression needs a
  written reason next to it; there are none today.
- Adding a page adds three scans automatically. Run the suite before merging UI
  work.
