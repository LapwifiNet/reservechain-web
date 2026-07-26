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

    // Only audit mutating requests on role-guarded routes
    const isMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method);
    const isRoleGuarded = requiredRoles && requiredRoles.length > 0;

    if (!isMutating || !isRoleGuarded) {
      return next.handle();
    }

    const user: AuthenticatedUser | undefined = request.user;
    const url = request.url;
    const method = request.method;

    // Extract resource type and ID from URL
    const resourceInfo = this.extractResourceInfo(url, method);

    // Sanitize request body to exclude sensitive data
    const sanitizedBody = this.sanitizeBody(request.body);

    const auditInput: AuditRecordInput = {
      actorId: user?.sub,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: this.determineAction(method, url),
      resourceType: resourceInfo.resourceType,
      resourceId: resourceInfo.resourceId,
      metadata: {
        url,
        method,
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
        this.logger.warn(`Request failed, not recording audit: ${error.message}`);
        return throwError(() => error);
      }),
    );
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
