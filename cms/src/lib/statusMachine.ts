/**
 * Status chip state machine — decision D5, CMS side.
 *
 * The website's src/lib/status.ts holds the same three scales for rendering;
 * this module is the half that *enforces* them, because access control alone
 * does not stop an admin moving `token` from "not issued" straight to
 * "deployed to testnet" in one save. The scales are ordered and a save may
 * move one step at a time in either direction — backwards is allowed (a state
 * entered in error has to be walkable back), a jump is not.
 *
 * The two copies are kept honest by tests/status-parity.test.mjs at the repo
 * root, which fails the build if the state lists diverge. Duplication is
 * deliberate: `cms/` builds with its own tsconfig and rootDir, so importing
 * the website's copy would mean either a cross-package build or a shared
 * package for three string arrays.
 */

export const PUBLICATION_STATES = [
  'pending',
  'in-preparation',
  'published',
] as const;

export const TOKEN_STATES = [
  'not-issued',
  'proposed',
  'in-development',
  'testnet-deployed',
] as const;

export const ASSET_STATES = [
  'pending',
  'documentation-in-preparation',
  'independently-verified',
] as const;

export const STATUS_SCALES = {
  publication: PUBLICATION_STATES,
  token: TOKEN_STATES,
  asset: ASSET_STATES,
} as const;

export type StatusAxis = keyof typeof STATUS_SCALES;

/** The state each axis starts at and falls back to: the least claim. */
export const DEFAULT_STATE: Record<StatusAxis, string> = {
  publication: 'pending',
  token: 'not-issued',
  asset: 'pending',
};

/** Payload `select` options for an axis, labelled for the admin UI. */
export function optionsFor(axis: StatusAxis): Array<{ label: string; value: string }> {
  return STATUS_SCALES[axis].map((value) => ({ label: LABELS[value], value }));
}

/**
 * Admin-facing labels. These are *not* the public chip text — the website
 * translates its own approved strings from the enum (guardrail 6). They exist
 * so the dropdown is readable to whoever is changing it.
 */
const LABELS: Record<string, string> = {
  pending: 'Pending',
  'in-preparation': 'In preparation',
  published: 'Published',
  'not-issued': 'Not issued',
  proposed: 'Proposed',
  'in-development': 'In development',
  'testnet-deployed': 'Deployed to testnet',
  'documentation-in-preparation': 'Documentation in preparation',
  'independently-verified': 'Independently verified',
};

/** Whether `to` is reachable from `from` in one save. */
export function canTransition(axis: StatusAxis, from: string, to: string): boolean {
  const scale = STATUS_SCALES[axis] as readonly string[];
  const a = scale.indexOf(from);
  const b = scale.indexOf(to);
  if (a === -1 || b === -1) return false;
  return Math.abs(a - b) <= 1;
}

/**
 * Explain why a transition is refused, or null when it is allowed. Used by the
 * Settings `beforeChange` hook to build a message an admin can act on.
 */
export function transitionError(
  axis: StatusAxis,
  from: string,
  to: string,
): string | null {
  if (from === to) return null;
  const scale = STATUS_SCALES[axis] as readonly string[];
  if (!scale.includes(to)) {
    return `${axis}: "${to}" is not a valid state (expected one of ${scale.join(', ')})`;
  }
  if (!scale.includes(from)) return null; // unset / migrated doc: allow the first save
  if (canTransition(axis, from, to)) return null;
  const a = scale.indexOf(from);
  const b = scale.indexOf(to);
  const next = scale[b > a ? a + 1 : a - 1];
  return (
    `${axis}: cannot move from "${from}" to "${to}" in one step — ` +
    `the next state is "${next}". Advance one state at a time so each ` +
    `change is a reviewable claim.`
  );
}
