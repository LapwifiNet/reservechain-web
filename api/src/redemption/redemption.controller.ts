import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RequireFlag } from '../common/decorators/require-flag.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InvestorJwtGuard } from '../investor/investor-jwt.guard';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import { RedemptionService } from './redemption.service';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { RejectRedemptionDto, SettleRedemptionDto } from './dto/review-redemption.dto';
import { ApiInactive } from '../common/decorators/api-inactive.decorator';

/**
 * Redemption API (P12) — INACTIVE.
 *
 * Gated by REDEMPTION_ENABLED at the class level; the service refuses even when
 * the flag is on. See RedemptionService for why.
 *
 * Investor-scoped routes use InvestorJwtGuard, so they carry no `@Roles` — the
 * Role enum must not gain an investor value (invariant 20). The class therefore
 * carries `@AuditAs('investor')`, which brings those routes into
 * AuditInterceptor's scope and attributes them to the investor subject rather
 * than to a staff principal. Without it they would be silently unaudited the
 * moment this module was implemented.
 */
@ApiInactive('P12', 'REDEMPTION_ENABLED')
@Controller('redemption')
@AuditAs('investor')
@RequireFlag('REDEMPTION_ENABLED')
@UseGuards(FeatureFlagGuard)
export class RedemptionController {
  constructor(private readonly service: RedemptionService) {}

  @Post('requests')
  @UseGuards(InvestorJwtGuard)
  create(@Body() _dto: CreateRedemptionDto) {
    return this.service.create();
  }

  @Get('requests/mine')
  @UseGuards(InvestorJwtGuard)
  mine() {
    return this.service.listMine();
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  list(@Query('status') _status?: string, @Query('take') _take?: string) {
    return this.service.listAll();
  }

  @Post('requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  approve(@Param('id') _id: string) {
    return this.service.approve();
  }

  @Post('requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  reject(@Param('id') _id: string, @Body() _dto: RejectRedemptionDto) {
    return this.service.reject();
  }

  @Post('requests/:id/settle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  settle(@Param('id') _id: string, @Body() _dto: SettleRedemptionDto) {
    return this.service.settle();
  }
}
