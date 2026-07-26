import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RequireFlag } from '../common/decorators/require-flag.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InvestorJwtGuard } from '../investor/investor-jwt.guard';
import { WalletService } from './wallet.service';
import { LinkWalletDto } from './dto/link-wallet.dto';

/**
 * Wallet API — INACTIVE.
 *
 * Class-gated by WALLET_ENABLED, and the service refuses even with the flag on.
 * See WalletService.
 *
 * The three investor routes use InvestorJwtGuard and therefore carry no
 * `@Roles`, so AuditInterceptor — which records only mutating requests on
 * role-guarded routes — would not record a wallet link or revoke if this module
 * were implemented. Nothing is unaudited today because nothing is written. Same
 * gap already recorded for the investor portal and the redemption routes; it
 * has to be closed when any of them is activated, not after.
 */
@Controller('wallet')
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
