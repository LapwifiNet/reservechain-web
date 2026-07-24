import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKycCaseDto } from './dto/create-kyc-case.dto';
import { ReviewKycCaseDto } from './dto/review-kyc-case.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, type AuthenticatedUser } from '../common/enums/role.enum';

// KYC/KYB case management is an internal compliance surface.
// All routes require authentication AND an admin/compliance role.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.COMPLIANCE)
@Controller('kyc')
export class KycController {
  constructor(private readonly service: KycService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('cases')
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 100);
  }

  @Get('cases/:id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post('cases')
  create(@Body() dto: CreateKycCaseDto) {
    return this.service.create(dto);
  }

  @Post('cases/:id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewKycCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user?.email) {
      throw new BadRequestException('reviewer_email_required');
    }
    return this.service.review(id, dto, user.email);
  }

  @Post('cases/:id/screen')
  screen(@Param('id') id: string) {
    return this.service.screen(id);
  }
}
