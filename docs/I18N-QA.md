# Translation QA (EN / ES / IT)

The site ships three locales through `next-intl`. `en` is authoritative; `es`
and `it` are translations of it. This is what is checked mechanically, what is
not, and why.

## Mechanical checks

Both live in `tests/i18n-parity.test.mjs` and run on `npm test`. There is one
mechanism, not two — a rule enforced in two places is a rule that eventually
disagrees with itself.

| Check | Catches |
| --- | --- |
| **Key parity** | A key path in `en.json` missing from `es.json`/`it.json`, or present in one of them with no `en` counterpart. Array indices included, so a locale that drops a list item is caught. |
| **ICU argument parity** | `{name}` renamed or dropped in a translation. Argument names are code: rename one and that locale throws `MISSING_VALUE` at render, the others are fine. |

Neither is caught by `next build`. next-intl resolves messages per request, so
a key missing from `it.json` compiles cleanly and fails in the browser, for
Italian readers only.

**Current surface of the ICU check: one message** (`portal.welcome`,
`Welcome, {name}`). It is worth having anyway — it costs nothing and the class
of defect is silent — but it is not doing much work today, and adding
interpolated copy is what makes it earn its place.

## Reconciliation with the i18n-QA overlay

The overlay's three message catalogues were **not applied**. They are a
snapshot of an early draft: 39 keys against the 753 the site now has, and only
**7 of the 39 key paths still exist**. Applying them would have deleted 746
keys per locale and added 32 orphans (`common.tagline`, `nav.whitepaper`,
`home.heroTitle`, …) that no component reads.

Its six proposed checks, against what already exists:

| # | Check | Verdict |
| --- | --- | --- |
| 1 | Key parity, both directions | **Redundant** — `tests/i18n-parity.test.mjs` has enforced this since overlay #7. |
| 2 | No ES/IT value may equal its EN value | **Contradictory** — would flag `disclosure.full` and `disclosure.provisional`, which are frozen legal content that must stay verbatim in every locale (AGENTS §5.5), plus `Legal`, `Whitepaper`, `Metal`, `Token` and the brand. 15 such values in `es`, 20 in `it`, and they are correct. |
| 3 | ICU placeholders match across locales | **New** — adopted. Currently passes; verified to fail on a renamed argument. |
| 4 | Figures stay identical across locales | **Contradictory** — ES and IT correctly write `99,9999%` with a decimal comma where EN writes `99.9999%`. The check reports correct localisation as a defect, on exactly the two program titles. |
| 5 | Length and overflow at 320px | **New, not automatable** — kept as a manual step below. |
| 6 | Formal register (ES *usted*, IT impersonal) | **New, not automatable** — manual. |

Its glossary was also checked against the catalogues:

- `Waitlist → Lista de espera / Lista d'attesa` — matches.
- `Purity → Pureza / Purezza`, `Lot → Lote / Lotto` — match.
- `Digital Asset Passport → Pasaporte Digital del Activo` — the site uses
  **`de Activo`**, not `del Activo`. IT `Passaporto Digitale dell'Attivo`
  matches. Not worth a change; recorded so the next reviewer does not "fix"
  the site to match the glossary.
- `Individual / Entity → Individual / Entidad` — **wrong**. The word "Entity"
  appears in no message, there is no `waitlist.typeEntity` key, and the
  overlay's claim that it "matches API `individual`/`entity`" is false: the
  API's `investorType` is `@IsIn(['institution', 'investor', 'partner',
  'other'])` and the waitlist form offers exactly those four. Anyone
  translating to the glossary would produce a value the API rejects with 400.

## The disclosure

`disclosure.full` and `disclosure.provisional` are identical in all three
locales on purpose. AGENTS §5.5 freezes the prelaunch disclosure: it is not to
be reworded, shortened, or loosely translated. If localised versions are ever
wanted they need legal sign-off before they ship, and the page should say
which language is authoritative. Until then, identical is the correct state
and any check that calls it a defect is wrong.

## Manual checks

Nothing below is claimed to be done.

- [ ] ES and IT at 320px and 200% zoom: nav labels, buttons and the waitlist
      stepper. ES/IT run 15–25% longer than EN and this is where it shows.
- [ ] Formal register consistent across the site (ES *usted*, IT impersonal).
- [ ] Numbers and percentages read naturally per locale — decimal comma in
      ES/IT is correct, not a defect.
- [ ] Locale switcher labels and `<html lang>` on every route.
- [ ] Any new interpolated string is reviewed for argument names before it is
      handed to a translator.
