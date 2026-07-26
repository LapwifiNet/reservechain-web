import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { from, Observable, throwError } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { AuditService, AuditRecordInput } from './audit.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import {
  AUDIT_DOMAIN_KEY,
  type AuditSpec,
} from '../common/decorators/audit-domain.decorator';
import type { AuthenticatedUser } from '../common/enums/role.enum';

/**
 * Interceptor that automatically records mutating requests (POST, PATCH, PUT, DELETE)
 * reaching a role-guarded route. Never logs passwords, tokens, document contents,
 * or email addresses of waitlist subjects.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check if the route has role guards (i.e., is protected)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // A route may instead declare an actor domain with @AuditAs().
    const auditSpec = this.reflector.getAllAndOverride<AuditSpec>(
      AUDIT_DOMAIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    const auditDomain = auditSpec?.domain;
    const recordFailures = auditSpec?.options?.outcomes === 'all';

    // Audit mutating requests that are either role-guarded (every staff
    // action) or explicitly attributed to another actor domain. Investor
    // routes carry no @Roles by design — the Role enum must not gain an
    // investor value (invariant 20) — so without the second clause investor
    // self-registration was recorded nowhere.
    const isMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method);
    const isRoleGuarded = requiredRoles && requiredRoles.length > 0;

    if (!isMutating || !(isRoleGuarded || auditDomain)) {
      return next.handle();
    }

    const user: AuthenticatedUser | undefined = request.user;
    const url = request.url;
    const method = request.method;

    // Extract resource type and ID from URL
    const resourceInfo = this.extractResourceInfo(url, method);

    // Sanitize request body to exclude sensitive data
    const sanitizedBody = this.sanitizeBody(request.body);

    // Actor resolution. Staff routes read req.user; investor routes read
    // req.investor, which InvestorJwtGuard sets. On register and login there is
    // no authenticated principal yet, so the actor is the subject of the
    // request itself, taken from the body BEFORE sanitizeBody redacts it.
    //
    // actorRole is a plain String column, so 'investor' is recorded without
    // touching the Role enum (invariant 20). An investor is never attributed
    // as an admin principal, and never as `service@reservechain`.
    const investor: { sub?: string; email?: string } | undefined =
      request.investor;
    const isStaffPrincipal = !auditDomain || auditDomain === 'staff';

    const actorId = auditDomain === 'investor' ? investor?.sub : user?.sub;
    const actorEmail = isStaffPrincipal
      ? (user?.email ?? this.subjectEmailFromBody(request.body))
      : (investor?.email ?? this.subjectEmailFromBody(request.body));
    const actorRole = isStaffPrincipal
      ? (user?.role ?? auditDomain)
      : auditDomain;

    const auditInput: AuditRecordInput = {
      actorId,
      actorEmail,
      actorRole,
      action: this.determineAction(method, url),
      resourceType: resourceInfo.resourceType,
      resourceId: resourceInfo.resourceId,
      metadata: {
        url,
        method,
        outcome: 'success',
        body: sanitizedBody,
        query: this.sanitizeQuery(request.query),
      },
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'] as string,
    };

    // The audit write is part of the response stream, not a fire-and-forget
    // callback: concatMap defers the response until record() has committed, so
    // a caller that sees the response can rely on the audit row existing. An
    // earlier version recorded from an un-awaited async tap, which let the
    // write land after an assertion (or a human) had already read the log.
    return next.handle().pipe(
      concatMap((value) =>
        from(this.recordIfSuccessful(response, auditInput)).pipe(
          map(() => value),
        ),
      ),
      catchError((error) => {
        if (!recordFailures) {
          this.logger.warn(
            `Request failed, not recording audit: ${error.message}`,
          );
          return throwError(() => error);
        }

        // The failure IS the record. A rejected sign-in is written with the
        // actor identity stripped: an audit row that named the attempted
        // address would turn the trail into an oracle for which addresses
        // exist, and it would do so on a route reachable without credentials.
        // AuthService throws the same invalid_credentials for an unknown user
        // and a wrong password, so 'failure' alone discloses nothing.
        const failureInput: AuditRecordInput = {
          ...auditInput,
          actorId: undefined,
          actorEmail: '[PII_REDACTED]',
          metadata: {
            ...(auditInput.metadata as Record<string, unknown>),
            outcome: 'failure',
            // The reason is deliberately the generic code the caller already
            // received; nothing here distinguishes "no such account" from
            // "wrong password".
            reason: 'rejected',
          },
        };
        return from(this.record(failureInput)).pipe(
          concatMap(() => throwError(() => error)),
        );
      }),
    );
  }

  /**
   * The email of the subject a request is about, for unauthenticated
   * investor-domain mutations (register, login) where no principal exists yet.
   *
   * This is the actor's identity, not request content: it is stored in
   * actorEmail, the same column a staff actor's email occupies, and the audit
   * read surface is ADMIN/COMPLIANCE-only. It is deliberately separate from
   * sanitizeBody, which still redacts `email` inside metadata.body — an audit
   * event has to say who acted, or it is not an audit event.
   */
  private subjectEmailFromBody(body: unknown): string | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const email = (body as Record<string, unknown>).email;
    return typeof email === 'string' ? email : undefined;
  }

  /**
   * Records the event only on success (2xx/3xx). A failed audit write is
   * logged and swallowed — it must never surface to the caller.
   */
  private async recordIfSuccessful(
    response: { statusCode: number },
    input: AuditRecordInput,
  ): Promise<void> {
    if (response.statusCode < 200 || response.statusCode >= 400) return;
    await this.record(input);
  }

  /**
   * Writes one audit event. A failed audit write is logged and swallowed — it
   * must never surface to the caller, and on the failure path it must never
   * mask the original error.
   */
  private async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.auditService.record(input);
    } catch (error) {
      this.logger.error('Failed to record audit event', error);
    }
  }

  private extractResourceInfo(url: string, _method: string): {
    resourceType: string | undefined;
    resourceId: string | undefined;
  } {
    const parts = url.split('/').filter(Boolean);
    if (parts.length < 2) return { resourceType: undefined, resourceId: undefined };

    const resourceType = parts[1]; // e.g., 'waitlist', 'kyc', 'dashboard'
    const resourceId = parts[2]; // e.g., ID parameter

    return { resourceType, resourceId };
  }

  private determineAction(method: string, url: string): string {
    const parts = url.split('/').filter(Boolean);
    const resource = parts[1] || 'unknown';

    const actionMap: Record<string, string> = {
      POST: 'create',
      PATCH: 'update',
      PUT: 'replace',
      DELETE: 'delete',
    };

    const baseAction = actionMap[method] || method.toLowerCase();
    return `${baseAction}.${resource}`;
  }

  /**
   * Sanitizes request body to exclude sensitive data.
   * Never logs passwords, tokens, document contents, or email addresses of waitlist subjects.
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return {};

    const sensitiveFields = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'apiKey', 'secret'];
    const piiFields = ['email', 'fullName', 'legalName', 'firstName', 'lastName', 'address', 'phone', 'organization'];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive fields
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
      // For KYC documents, store only the case ID
      else if (lowerKey.includes('document') || lowerKey.includes('file')) {
        sanitized[key] = '[DOCUMENT_REDACTED]';
      }
      // Subject identifiers are PII and are never written to the audit trail.
      // This is unconditional: an earlier version only redacted `email`, and
      // only when the body also carried an `id`, so a KYC create body of
      // { subjectType, legalName, country } stored legalName in clear text.
      // Non-PII keys such as `id` still pass through, keeping records traceable.
      else if (
        piiFields.some((field) => lowerKey.includes(field.toLowerCase()))
      ) {
        sanitized[key] = '[PII_REDACTED]';
      }
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes query parameters to exclude sensitive data.
   */
  private sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
    if (!query) return {};

    const sensitiveFields = ['token', 'password', 'secret', 'key'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private extractIpAddress(request: Record<string, unknown>): string {
    const headers = request.headers as Record<string, string>;
    return (
      headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      headers['x-real-ip'] ||
      'unknown'
    );
  }
}
