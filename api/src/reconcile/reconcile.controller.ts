import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReconcileService } from './reconcile.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiOkResponse } from '@nestjs/swagger';
import { ReconcileRunResponse, ReconcileExceptionSummary } from './dto/reconcile.response.dto';

class RunReconcileDto {
  @IsIn([
    'all',
    'chain_gaps',
    'audit_integrity',
    'supply_coverage',
    'redemption_recon',
    'wallet_ledger',
    'treasury_recon',
    'fee_recon',
  ])
  type: string;
}

class ResolveExceptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

/**
 * P17 reconciliation surface. ADMIN/COMPLIANCE only — a public runner would
 * let anyone burn DB writes and read exception internals.
 */
@ApiTags('reconcile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.COMPLIANCE)
@Controller('reconcile')
export class ReconcileController {
  constructor(private readonly service: ReconcileService) {}

  @AuditAs('staff')
  @ApiOkResponse({ type: ReconcileRunResponse })
  @Post('run')
  run(@Body() dto: RunReconcileDto, @CurrentUser() user: { email?: string }) {
    return this.service.run(dto.type, user?.email);
  }

  @ApiOkResponse({ type: [ReconcileRunResponse] })
  @Get('runs')
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 20);
  }

  @ApiOkResponse({ type: ReconcileRunResponse })
  @Get('runs/:id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @ApiOkResponse({ type: [ReconcileExceptionSummary] })
  @Get('exceptions')
  exceptions(
    @Query('code') code?: string,
    @Query('severity') severity?: string,
    @Query('take') take?: string,
  ) {
    return this.service.exceptions({
      code,
      severity,
      take: take ? Number(take) : 50,
    });
  }

  @AuditAs('staff')
  @ApiOkResponse({ type: ReconcileExceptionSummary })
  @Post('exceptions/:id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() _dto: ResolveExceptionDto,
    @CurrentUser() user: { email?: string },
  ) {
    return this.service.resolveException(id, user?.email ?? 'unknown');
  }
}
