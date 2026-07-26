import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import type { AuthenticatedUser } from '../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // Audited on BOTH outcomes. A staff sign-in is the event an attribution
  // trail most needs, and a run of rejections is the signal that matters most —
  // recording only successes would make a credential-stuffing run invisible.
  //
  // The route is public by necessity (it issues the session), so it carries no
  // @Roles and would otherwise fall outside the interceptor entirely.
  //
  // Failures are written with the actor stripped to '[PII_REDACTED]': naming
  // the attempted address on an unauthenticated route would turn the audit
  // trail into an oracle for which accounts exist. AuthService raises the same
  // invalid_credentials for an unknown user and a wrong password, so the
  // recorded outcome discloses nothing beyond "an attempt was rejected".
  @AuditAs('staff', { outcomes: 'all' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
