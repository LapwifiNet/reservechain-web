import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RequireFlag } from '../common/decorators/require-flag.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InvestorJwtGuard } from '../investor/investor-jwt.guard';
import { RedemptionService } from './redemption.service';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { RejectRedemptionDto, SettleRedemptionDto } from './dto/review-redemption.dto';

/**
 * Redemption API (P12) — INACTIVE.
 *
 * Gated by REDEMPTION_ENABLED at the class level; the service refuses even when
 * the flag is on. See RedemptionService for why.
 *
 * Investor-scoped routes use InvestorJwtGuard, so they carry no `@Roles`. That
 * has a consequence worth stating rather than discovering later: AuditInterceptor
 * records only mutating requests on role-guarded routes, so if this module is
 * ever implemented, an investor creating a redemption request will not be
 * audited unless the interceptor's scope is widened at the same time. Nothing
 * is unaudited today because nothing is written. This is the same gap already
 * recorded against the investor portal.
 */
@Controller('redemption')
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
