import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RequireFlag } from '../common/decorators/require-flag.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InvestorJwtGuard } from '../investor/investor-jwt.guard';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { RejectPurchaseDto, SettlePurchaseDto } from './dto/review-purchase.dto';

/**
 * Purchase API — INACTIVE.
 *
 * Class-gated by PURCHASE_ENABLED, and the service refuses even with the flag
 * on. See PurchaseService.
 *
 * As with the wallet module, the investor-scoped routes carry no `@Roles` and
 * would fall outside AuditInterceptor's scope if implemented. For an order
 * pipeline that is the more serious half of the gap: the staff decisions
 * (approve/reject/settle) are role-guarded and would be audited, but the
 * investor's own intent — the thing being decided on — would not.
 */
@Controller('purchase')
@RequireFlag('PURCHASE_ENABLED')
@UseGuards(FeatureFlagGuard)
export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}

  // The only unauthenticated route here: public once active, so it takes the
  // same tightened limit as every other internet-reachable public route.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('disclosure')
  disclosure() {
    return this.service.disclosure();
  }

  @Post('intents')
  @UseGuards(InvestorJwtGuard)
  create(@Body() _dto: CreatePurchaseDto) {
    return this.service.create();
  }

  @Get('intents/mine')
  @UseGuards(InvestorJwtGuard)
  mine() {
    return this.service.listMine();
  }

  @Get('intents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  list(@Query('status') _status?: string, @Query('take') _take?: string) {
    return this.service.listAll();
  }

  @Post('intents/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  approve(@Param('id') _id: string) {
    return this.service.approve();
  }

  @Post('intents/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  reject(@Param('id') _id: string, @Body() _dto: RejectPurchaseDto) {
    return this.service.reject();
  }

  @Post('intents/:id/settle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  settle(@Param('id') _id: string, @Body() _dto: SettlePurchaseDto) {
    return this.service.settle();
  }
}
