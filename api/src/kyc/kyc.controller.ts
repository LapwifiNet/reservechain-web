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
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  KycCaseDetail,
  KycCaseListItem,
  KycScreenResult,
  KycStats,
} from './dto/kyc.response.dto';

// KYC/KYB case management is an internal compliance surface.
// All routes require authentication AND an admin/compliance role.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.COMPLIANCE)
@ApiTags('kyc')
@ApiBearerAuth()
@Controller('kyc')
export class KycController {
  constructor(private readonly service: KycService) {}

  @ApiOkResponse({ type: KycStats })
  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @ApiOkResponse({ type: [KycCaseListItem] })
  @Get('cases')
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 100);
  }

  @ApiOkResponse({ type: KycCaseDetail })
  @Get('cases/:id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @ApiOkResponse({ type: KycCaseDetail })
  @Post('cases')
  create(@Body() dto: CreateKycCaseDto) {
    return this.service.create(dto);
  }

  @ApiOkResponse({ type: KycCaseDetail })
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

  @ApiOkResponse({ type: KycScreenResult })
  @Post('cases/:id/screen')
  screen(@Param('id') id: string) {
    return this.service.screen(id);
  }
}
