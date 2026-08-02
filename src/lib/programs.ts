/**
 * Asset-program stage and metal, as the website reads them (SC-WEB-ASSETS).
 *
 * The CMS (`cms/src/collections/AssetPrograms.ts`) stores both as enums; this
 * module is the only place that turns one into something renderable. It exists
 * for the same reason `src/lib/status.ts` does: a component that interpolates
 * `t(\`stage.${value}\`)` renders the key path itself when the CMS grows a
 * value the website has no label for — on a public page, in every locale.
 *
 * Both coercions fall back to the reading that claims the least:
 *
 *  - stage -> `illustrative`. An unknown stage must never read as an offer,
 *    and `active` is already softened to "In preparation" for that reason
 *    (guardrails 1, 6). Falling back to the raw string or to an empty badge
 *    would both leak the CMS's own vocabulary onto the page.
 *  - metal -> `other`. The CMS marks `metal` required, so a missing one means
 *    a shape the website did not expect, not a copper program.
 *
 * Kept in step with the CMS by `tests/programs-parity.test.mjs`.
 */

export const PROGRAM_STAGES = ['illustrative', 'active', 'not_for_sale'] as const;
export const PROGRAM_METALS = ['copper', 'nickel', 'other'] as const;

export type ProgramStage = (typeof PROGRAM_STAGES)[number];
export type ProgramMetal = (typeof PROGRAM_METALS)[number];

/** The stage the page will render — never the raw value, never empty. */
export function coerceStage(value: string | null | undefined): ProgramStage {
  return (PROGRAM_STAGES as readonly string[]).includes(value ?? '')
    ? (value as ProgramStage)
    : 'illustrative';
}

/** The metal the page will render. Unknown or missing reads as "Other". */
export function coerceMetal(value: string | null | undefined): ProgramMetal {
  return (PROGRAM_METALS as readonly string[]).includes(value ?? '')
    ? (value as ProgramMetal)
    : 'other';
}

/** Message key, relative to the `page.industrial-metal-assets.grid` namespace. */
export function stageLabelKey(value: string | null | undefined): string {
  return `stage.${coerceStage(value)}`;
}

/** Message key, relative to the `page.industrial-metal-assets.grid` namespace. */
export function metalLabelKey(value: string | null | undefined): string {
  return `metals.${coerceMetal(value)}`;
}

/**
 * `kind` for StatusTag. Its map is keyed on the value with non-letters
 * stripped, so `not_for_sale` reaches it as `notforsale` (danger) and
 * `illustrative` as itself (warn). `active` is deliberately absent from that
 * map: it falls through to the neutral "pending" styling, because a coloured
 * badge saying "In preparation" is closer to a claim than a grey one.
 */
export function stageTone(value: string | null | undefined): string {
  return coerceStage(value);
}
