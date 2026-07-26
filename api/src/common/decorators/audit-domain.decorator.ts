import { SetMetadata } from '@nestjs/common';

export const AUDIT_DOMAIN_KEY = 'auditDomain';

/** Actor domains the audit trail can attribute a mutation to. */
export type AuditDomain = 'investor' | 'staff' | 'public';

export type AuditOptions = {
  /**
   * Which outcomes to record. Default 'success' matches the interceptor's
   * baseline: a mutation that failed changed nothing, so there is nothing to
   * attribute.
   *
   * 'all' additionally records failures, and is for routes where the FAILURE is
   * itself the signal — a run of rejected sign-ins being the obvious case.
   */
  outcomes?: 'success' | 'all';
  /**
   * Redact the actor's identity even on success. Not currently used; failures
   * are always redacted regardless of this setting (see the interceptor).
   */
  redactActor?: boolean;
};

export type AuditSpec = { domain: AuditDomain; options: AuditOptions };

/**
 * Marks a controller (or handler) as audited, and names the actor domain used
 * for attribution.
 *
 * The interceptor's baseline scope is mutating requests on role-guarded routes,
 * which covers every staff action behind `@Roles(...)`. Three kinds of route
 * fall outside it and need this annotation:
 *
 * - investor routes, authenticated by InvestorJwtGuard and carrying no `@Roles`
 *   deliberately, because the `Role` enum feeds `@Roles(...)` on admin routes
 *   and must never gain an investor value (invariant 20);
 * - `POST /auth/login`, which is public by necessity — it issues the session —
 *   yet is the single most security-relevant staff event there is;
 * - `POST /waitlist`, a public unauthenticated write that persists a PII row.
 *
 * An explicit annotation rather than a path check or a guard sniff, so the
 * audited surface is visible at the controller and greppable.
 */
export const AuditAs = (domain: AuditDomain, options: AuditOptions = {}) =>
  SetMetadata(AUDIT_DOMAIN_KEY, { domain, options } satisfies AuditSpec);
