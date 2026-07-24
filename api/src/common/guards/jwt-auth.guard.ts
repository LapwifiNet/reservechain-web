import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../enums/role.enum';
import * as crypto from 'crypto';

/**
 * Verifies a Bearer token on the request.
 * - Accepts a long-lived SERVICE_API_TOKEN (used by trusted server-to-server
 *   callers such as the admin console) and treats it as an admin service principal.
 * - Otherwise verifies a signed JWT issued by /api/auth/login.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
        try {
          const match = crypto.timingSafeEqual(tokenBuffer, serviceTokenBuffer);
          if (match) {
            req.user = {
              email: 'service@reservechain',
              role: Role.ADMIN,
              service: true,
            };
            return true;
          }
        } catch {
          // Buffer length mismatch or other error, fall through to JWT verification
        }
      }
    }

    try {
      const payload = await this.jwt.verifyAsync(token);
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
}
