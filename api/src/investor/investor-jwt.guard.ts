import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Verifies an investor Bearer token. The JwtService injected here belongs to
 * InvestorModule's JwtModule, so verification uses INVESTOR_JWT_SECRET — an
 * admin token (signed with JWT_SECRET) fails the signature check before any
 * claim is read. The typ check on top rejects any token that is not explicitly
 * an investor token, so even two identical secrets would not merge the
 * domains. The isolation runs both ways: JwtAuthGuard on the admin side
 * accepts only typ='admin'.
 */
@Injectable()
export class InvestorJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] ?? '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('missing_bearer_token');
    }
    try {
      const payload = await this.jwt.verifyAsync(token);
      // Reject a missing typ too — nothing defaults into the investor domain.
      if (payload?.typ !== 'investor') {
        throw new Error('wrong_token_type');
      }
      req.investor = { sub: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('invalid_token');
    }
  }
}
