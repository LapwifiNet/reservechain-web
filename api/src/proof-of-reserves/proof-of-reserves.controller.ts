import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RequireFlag } from '../common/decorators/require-flag.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ProofOfReservesService } from './proof-of-reserves.service';
import { CreateAttestationDto } from './dto/create-attestation.dto';

/**
 * Proof-of-Reserves API (P11) — INACTIVE.
 *
 * The class is gated by PROOF_OF_RESERVES_ENABLED, so with the flag off every
 * route below refuses at the guard with 501. With the flag on the routes are
 * reachable but the service still refuses: see ProofOfReservesService for why
 * this is a refusal surface rather than an implementation behind a switch.
 *
 * The route table, roles and DTOs are real and are the published contract.
 */
@Controller('por')
@RequireFlag('PROOF_OF_RESERVES_ENABLED')
@UseGuards(FeatureFlagGuard)
export class ProofOfReservesController {
  constructor(private readonly service: ProofOfReservesService) {}

  // The only unauthenticated route in this module: public once active, so it
  // carries the same tightened limit as the other internet-reachable
  // unauthenticated routes (auth login, waitlist create, investor auth).
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('status')
  status() {
    return this.service.publicStatus();
  }

  @Get('attestations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  list(@Query('take') _take?: string) {
    return this.service.list();
  }

  @Post('attestations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  create(@Body() _dto: CreateAttestationDto) {
    return this.service.create();
  }

  @Post('attestations/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  publish(@Param('id') _id: string) {
    return this.service.publish();
  }
}
