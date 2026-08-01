import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RequireFlag } from '../common/decorators/require-flag.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InvestorJwtGuard } from '../investor/investor-jwt.guard';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import { WalletService } from './wallet.service';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { ApiInactive } from '../common/decorators/api-inactive.decorator';

/**
 * Wallet API — INACTIVE.
 *
 * Class-gated by WALLET_ENABLED, and the service refuses even with the flag on.
 * See WalletService.
 *
 * The three investor routes use InvestorJwtGuard and carry no `@Roles`, so the
 * class carries `@AuditAs('investor')`: a wallet link or revoke is recorded and
 * attributed to the investor, not to a staff principal. Linking a wallet ties a
 * durable public chain identifier to a named person, which is exactly the kind
 * of act an audit trail exists for.
 */
@ApiInactive('P13', 'WALLET_ENABLED')
@Controller('wallet')
@AuditAs('investor')
@RequireFlag('WALLET_ENABLED')
@UseGuards(FeatureFlagGuard)
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Post('link')
  @UseGuards(InvestorJwtGuard)
  link(@Body() _dto: LinkWalletDto) {
    return this.service.link();
  }

  @Get('me')
  @UseGuards(InvestorJwtGuard)
  me() {
    return this.service.me();
  }

  @Post('revoke')
  @UseGuards(InvestorJwtGuard)
  revoke() {
    return this.service.revoke();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  list(@Query('take') _take?: string) {
    return this.service.list();
  }
}
