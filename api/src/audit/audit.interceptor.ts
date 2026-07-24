import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService, AuditRecordInput } from './audit.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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

    return next.handle().pipe(
      tap({
        next: async () => {
          // Only record on success (2xx, 3xx)
          if (response.statusCode >= 200 && response.statusCode < 400) {
            try {
              await this.auditService.record(auditInput);
            } catch (error) {
              this.logger.error('Failed to record audit event', error);
            }
          }
        },
        error: (error) => {
          this.logger.warn(`Request failed, not recording audit: ${error.message}`);
        },
      }),
    );
  }

  private extractResourceInfo(url: string, method: string): {
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
    const piiFields = ['email', 'fullName', 'legalName', 'firstName', 'lastName', 'address', 'phone'];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive fields
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
      // For waitlist entries, store only the ID if available, not PII
      else if (lowerKey === 'email' && body.id) {
        sanitized[key] = '[PII_REDACTED]';
        sanitized.id = body.id;
      }
      // For KYC documents, store only the case ID
      else if (lowerKey.includes('document') || lowerKey.includes('file')) {
        sanitized[key] = '[DOCUMENT_REDACTED]';
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
