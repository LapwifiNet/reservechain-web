import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  WaitlistCount,
  WaitlistCreated,
  WaitlistEntryResponse,
} from './dto/waitlist.response.dto';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly service: WaitlistService) {}

  // Public by design — this is the public website's signup form. That also makes
  // it an internet-reachable unauthenticated write, so it gets a tighter limit
  // than the global 100/min baseline.
  // Audited. A public unauthenticated signup still persists a PII row — name,
  // email, organisation — and the same reasoning that brought investor
  // self-registration into scope applies here: the actor is the registrant, and
  // "nobody was signed in" is not a reason for a persisted personal record to
  // have no audit event. sanitizeBody redacts email, fullName and organisation
  // in the stored body; the registrant's address is kept in actorEmail, which
  // is the attribution field and is readable only by ADMIN/COMPLIANCE — the
  // same roles that can already read the waitlist itself.
  //
  // Only successes are recorded: a rejected signup persists nothing, and the
  // failure of a public marketing form is not a security signal the way a
  // rejected sign-in is.
  @AuditAs('public')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: WaitlistCreated })
  @Post()
  create(@Body() dto: CreateWaitlistDto) {
    return this.service.create(dto);
  }

  @ApiOkResponse({ type: WaitlistCount })
  @Get('count')
  async count() {
    return { count: await this.service.count() };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [WaitlistEntryResponse] })
  @Get()
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 50);
  }
}
