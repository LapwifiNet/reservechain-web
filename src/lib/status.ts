/**
 * Project status chips — FR-STATUS, decision log D5.
 *
 * D5 asked for "status chips (publication / token / asset)" and resolved the
 * same way D4 resolved website modes: the state is CMS data (SC-CMS-SETTINGS,
 * Payload `settings` collection), the website renders chips from it.
 *
 * The part that is *not* CMS data is the wording. A chip is a public claim
 * about the project's stage, and guardrails 3 and 6 (no fabricated data,
 * language discipline) do not survive a free-text field an admin can type
 * "Tokens available now" into. So the CMS stores an **enum state only**, and
 * this file maps that state to an approved, translated string. The set of
 * things a chip can say is therefore fixed at build time, in review, in three
 * locales — not at runtime by whoever holds an admin login.
 *
 * Two further properties follow from the guardrails rather than from taste:
 *
 * - The token scale stops at `testnet-deployed`. There is deliberately no
 *   "issued", "live" or "tradeable" state, because guardrail 1 is testnet-only
 *   and guardrail 6 forbids implying tokens are sold or traded. The enum
 *   cannot express an offer, so no CMS edit can create one.
 * - A status is display-only. Like a mode change under D4, changing a chip
 *   never activates a gated module: Proof-of-Reserves, redemption, wallet and
 *   purchase stay behind their env flags and keep answering 501 (guardrail 2).
 *
 * When the CMS is unreachable the fallback is the *most conservative* state,
 * not the last known one (invariant 29: public pages degrade, they do not
 * fail — and degrading must never read as more progress than we can prove).
 */

/** Publication state of the project's documentation. */
export const PUBLICATION_STATES = [
  'pending',
  'in-preparation',
  'published',
] as const;

/** Token state. Stops at testnet by design — see the file header. */
export const TOKEN_STATES = [
  'not-issued',
  'proposed',
  'in-development',
  'testnet-deployed',
] as const;

/** Asset verification state. */
export const ASSET_STATES = [
  'pending',
  'documentation-in-preparation',
  'independently-verified',
] as const;

export type PublicationState = (typeof PUBLICATION_STATES)[number];
export type TokenState = (typeof TOKEN_STATES)[number];
export type AssetState = (typeof ASSET_STATES)[number];

export type ProjectStatus = {
  publication: PublicationState;
  token: TokenState;
  asset: AssetState;
};

/**
 * The state each axis falls back to. These are the first element of each
 * scale: the reading that claims the least.
 */
export const DEFAULT_STATUS: ProjectStatus = {
  publication: 'pending',
  token: 'not-issued',
  asset: 'pending',
};

/** The three axes, in the order the chips render. */
export const STATUS_AXES = ['publication', 'token', 'asset'] as const;
export type StatusAxis = (typeof STATUS_AXES)[number];

const SCALES: Record<StatusAxis, readonly string[]> = {
  publication: PUBLICATION_STATES,
  token: TOKEN_STATES,
  asset: ASSET_STATES,
};

/** Every state on an axis, in order. */
export function statesFor(axis: StatusAxis): readonly string[] {
  return SCALES[axis];
}

/**
 * Validate a raw CMS value against an axis, falling back to that axis's
 * default. Unknown values are not an error worth failing a public page over —
 * they are treated as "we cannot prove anything", same as an absent value.
 */
export function coerceState<A extends StatusAxis>(
  axis: A,
  raw: unknown,
): ProjectStatus[A] {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return (
    SCALES[axis].includes(value) ? value : DEFAULT_STATUS[axis]
  ) as ProjectStatus[A];
}

/**
 * Whether `to` is a legal next state for `axis` from `from`.
 *
 * The scales are ordered and a transition may move one step at a time, in
 * either direction. Forward-only would be wrong — a state can be entered in
 * error and has to be walkable back — but a jump is always a mistake or an
 * unreviewed claim: `not-issued` → `testnet-deployed` skips the two states
 * that describe the work that makes the last one true. The CMS enforces the
 * same rule server-side (cms/src/lib/statusMachine.ts); this copy exists so
 * the website can reason about the machine without reaching into the CMS
 * package, and tests/status-parity.test.mjs fails the build if the two drift.
 */
export function canTransition(
  axis: StatusAxis,
  from: string,
  to: string,
): boolean {
  const scale = SCALES[axis];
  const a = scale.indexOf(from);
  const b = scale.indexOf(to);
  if (a === -1 || b === -1) return false;
  return Math.abs(a - b) <= 1;
}

/**
 * StatusTag tone for a state. `notissued` (danger) is reserved for the two
 * states that exist to say "this has not happened" loudly; everything else is
 * the neutral `pending` tone. Nothing maps to a success tone — there is no
 * state on these scales that warrants one pre-launch.
 */
export function statusTone(axis: StatusAxis, state: string): string {
  if (axis === 'token' && state === 'not-issued') return 'notissued';
  if (axis === 'asset' && state === 'pending') return 'pending';
  return 'pending';
}

/** Message key for a state's label, under the `status` namespace. */
export function statusLabelKey(axis: StatusAxis, state: string): string {
  return `${axis}.${state}`;
}

/**
 * Project status resolved from CMS settings (server-side), with the
 * conservative fallback above on any failure.
 */
export async function projectStatusFromCms(): Promise<ProjectStatus> {
  try {
    const { getWebsiteSettings } = await import('@/lib/cms');
    const s = await getWebsiteSettings();
    if (!s) return DEFAULT_STATUS;
    return {
      publication: coerceState('publication', s.publicationStatus),
      token: coerceState('token', s.tokenStatus),
      asset: coerceState('asset', s.assetStatus),
    };
  } catch {
    return DEFAULT_STATUS;
  }
}
