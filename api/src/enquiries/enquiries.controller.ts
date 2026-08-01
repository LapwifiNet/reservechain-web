import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { EnquiryCreated, EnquiryResponse } from './dto/enquiry.response.dto';

@ApiTags('enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly service: EnquiriesService) {}

  // Public by design — these are the website's enquiry forms. Audited like
  // the waitlist: a persisted personal record (name, email, message) must
  // have an audit event. sanitizeBody redacts email/fullName/message in the
  // stored body; the address stays in actorEmail for ADMIN/COMPLIANCE.
  @AuditAs('public')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: EnquiryCreated })
  @Post()
  create(@Body() dto: CreateEnquiryDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [EnquiryResponse] })
  @Get()
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 50);
  }
}
