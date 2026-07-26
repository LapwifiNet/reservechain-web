import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * Verifies an investor Bearer token.
 *
 * The investor signing key is read from ConfigService and passed explicitly to
 * verifyAsync, rather than inherited from whichever JwtService this guard's
 * injector happens to supply. That is deliberate and load-bearing.
 *
 * Nest instantiates `@UseGuards(...)` enhancers in the injector of the module
 * that declares the controller, not the module that exports the guard. So when
 * RedemptionModule used this guard, it was built against AuthModule's admin
 * JwtService and verified investor tokens with JWT_SECRET — confirmed by
 * request: a token carrying typ:'investor' but signed with the ADMIN secret
 * passed, while a correctly signed investor token was refused. Exporting the
 * guard from InvestorModule does not fix it, because the enhancer is
 * re-instantiated per host module.
 *
 * Binding the secret here makes the guard correct wherever it is mounted, which
 * is the only form that survives a future module reusing it. Invariants 19
 * and 34.
 */
@Injectable()
export class InvestorJwtGuard implements CanActivate {
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

    const secret = this.config.get<string>('INVESTOR_JWT_SECRET');
    if (!secret) {
      // Never fall back to the ambient secret: that is the domain merge.
      throw new UnauthorizedException('invalid_token');
    }

    try {
      const payload = await this.jwt.verifyAsync(token, { secret });
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
