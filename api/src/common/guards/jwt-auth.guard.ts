import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../enums/role.enum';
import { ALLOW_SERVICE_WRITE_KEY } from '../decorators/allow-service-write.decorator';
import * as crypto from 'crypto';

// Methods that can change server state. A request authenticated by the shared
// service token is refused on these unless the handler opts in explicitly.
const STATE_CHANGING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Verifies a Bearer token on the request.
 * - Accepts a long-lived SERVICE_API_TOKEN (used by trusted server-to-server
 *   callers such as the admin console) and treats it as a READ-ONLY admin
 *   service principal: it satisfies role checks on safe methods, but any
 *   state-changing request (POST/PATCH/PUT/DELETE) is refused with 403
 *   `service_principal_write_denied`. The rejection is 403 and not 401 by
 *   design — the caller is authenticated, it is simply not authorised to write.
 *   A single route may opt back in with `@AllowServiceWrite()`.
 * - Otherwise verifies a signed JWT issued by /api/auth/login. Those callers are
 *   unaffected by the rule above and write as themselves. The JWT must carry
 *   typ='admin' (P8): investor-portal tokens use a different signing secret
 *   AND typ='investor', and a token with no typ at all is rejected rather than
 *   defaulted into the admin domain.
 *
 * The restriction lives here rather than in individual controllers because
 * RolesGuard compares only `role`, and the service principal carries
 * Role.ADMIN — without it, the shared token would satisfy every `@Roles(...)`
 * check in the codebase and every write would be attributed to
 * `service@reservechain` instead of a named operator.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] ?? '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('missing_bearer_token');
    }

    const serviceToken = this.config.get<string>('SERVICE_API_TOKEN');
    if (serviceToken) {
      // Use constant-time comparison to prevent timing attacks
      const tokenBuffer = Buffer.from(token, 'utf8');
      const serviceTokenBuffer = Buffer.from(serviceToken, 'utf8');

      if (tokenBuffer.length === serviceTokenBuffer.length) {
        let match = false;
        try {
          match = crypto.timingSafeEqual(tokenBuffer, serviceTokenBuffer);
        } catch {
          // Buffer length mismatch or other error, fall through to JWT verification
        }
        if (match) {
          this.assertServicePrincipalMayProceed(ctx, req);
          req.user = {
            email: 'service@reservechain',
            role: Role.ADMIN,
            service: true,
          };
          return true;
        }
      }
    }

    try {
      const payload = await this.jwt.verifyAsync(token);
      // Token-domain isolation (P8): only admin-domain JWTs pass this guard.
      // A missing typ is rejected too — nothing defaults into the admin
      // domain, and pre-P8 sessions are deliberately invalidated.
      if (payload?.typ !== 'admin') {
        throw new Error('wrong_token_type');
      }
      req.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('invalid_token');
    }
  }

  /**
   * Refuses a state-changing request made with the service token, unless the
   * handler (or its controller) carries `@AllowServiceWrite()`.
   */
  private assertServicePrincipalMayProceed(
    ctx: ExecutionContext,
    req: { method?: string },
  ): void {
    const method = (req.method ?? '').toUpperCase();
    if (!STATE_CHANGING_METHODS.has(method)) return;

    const allowed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SERVICE_WRITE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (allowed) return;

    throw new ForbiddenException('service_principal_write_denied');
  }
}
