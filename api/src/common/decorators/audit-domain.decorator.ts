import { SetMetadata } from '@nestjs/common';

export const AUDIT_DOMAIN_KEY = 'auditDomain';

/** Actor domains the audit trail can attribute a mutation to. */
export type AuditDomain = 'investor';

/**
 * Marks a controller (or handler) as belonging to a non-staff actor domain, so
 * AuditInterceptor records its mutations.
 *
 * The interceptor's default scope is mutating requests on role-guarded routes,
 * which covers every staff action. Investor routes are authenticated by
 * InvestorJwtGuard and carry no `@Roles` — deliberately, because the `Role`
 * enum feeds `@Roles(...)` on admin routes and must never gain an investor
 * value (invariant 20) — so they fell outside that scope entirely. Investor
 * self-registration created a row holding an email and a full name with no
 * audit event at all.
 *
 * This is an explicit annotation rather than a path check or a guard sniff so
 * the audited surface is visible at the controller and greppable.
 */
export const AuditAs = (domain: AuditDomain) =>
  SetMetadata(AUDIT_DOMAIN_KEY, domain);
