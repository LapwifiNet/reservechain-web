/**
 * Website modes — FR-MODE.
 *
 * Spec (Wireframe Spec §G + PRD §7) defines ten modes that control what the
 * site displays: Development · Pre-Launch · Waitlist · Documentation Release ·
 * Asset Verification · Eligibility · Early Participation · Live Offering ·
 * Redemption · Enterprise Onboarding.
 *
 * Decision log D4 (Screen Registry): modes are CMS data (SC-CMS-SETTINGS,
 * Payload `settings` collection) read server-side with an env fallback —
 * `CMS_API_BASE` unreachable or doc missing → `SITE_MODE` env → `development`.
 * The four kill-switch flags (`POR_ENABLED` etc.) stay env-only and keep
 * answering 501; a mode change alone never opens a gated module. This file is
 * the single place the mode is read.
 *
 * Mode semantics at pre-launch:
 * - `development` (default): dev/staging. Everything above the fold works,
 *   but nothing may read as operational. Same content as prelaunch — the mode
 *   exists so a dev deployment can be told apart from a real one.
 * - `prelaunch`: the current honest state — in development, no offer.
 * - `waitlist`: waiting list open/emphasised; everything else unchanged.
 * - `documentation` and beyond: no behavioural difference until the matching
 *   module is enabled by an authorised admin action + deploy. Never automatic.
 *
 * Guardrails that survive regardless of mode:
 * - CR-3 verbatim disclosure is always rendered (footer + Legal page).
 * - No buy/wallet/payment/countdown UI at pre-launch.
 * - Gated modules (PoR, redemption, wallet, purchase) answer 501 unless their
 *   env flag is on, and even then only with the service-side refusal.
 */

export const SITE_MODES = [
  'development',
  'prelaunch',
  'waitlist',
  'documentation',
  'asset-verification',
  'eligibility',
  'early-participation',
  'live-offering',
  'redemption',
  'enterprise-onboarding',
] as const;

export type SiteMode = (typeof SITE_MODES)[number];

/** Modes that imply the project is in a live/offering state. */
export const OFFERING_MODES: readonly SiteMode[] = [
  'live-offering',
  'redemption',
  'enterprise-onboarding',
] as const;

/**
 * The configured mode, validated against SITE_MODES.
 * Unknown or unset values fall back to `development` — the safest reading.
 */
export function siteMode(): SiteMode {
  const raw = process.env.SITE_MODE?.trim().toLowerCase() ?? '';
  return (SITE_MODES as readonly string[]).includes(raw) ? (raw as SiteMode) : 'development';
}

/** True when the current mode is exactly `mode`. */
export function isMode(mode: SiteMode): boolean {
  return siteMode() === mode;
}

/**
 * Whether the deployment is in any offering-adjacent mode. The website uses
 * this to decide whether offering UI may even exist; the API does not consult
 * it — gated modules stay behind their own env flags (invariant 10).
 */
export function offeringMode(): boolean {
  return OFFERING_MODES.includes(siteMode());
}

/** Site mode resolved from CMS settings with env fallback (server-side). */
export async function siteModeFromCms(): Promise<SiteMode> {
  try {
    const { getWebsiteSettings } = await import('@/lib/cms');
    const s = await getWebsiteSettings();
    const raw = s?.siteMode?.trim().toLowerCase() ?? '';
    if ((SITE_MODES as readonly string[]).includes(raw)) return raw as SiteMode;
  } catch {
    /* fall through to env */
  }
  return siteMode();
}

/** Human label for the current mode, used by the dev banner. */
export function siteModeLabel(mode: SiteMode): string {
  return mode
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
