import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvestorService } from './investor.service';
import { RegisterInvestorDto } from './dto/register-investor.dto';
import { LoginInvestorDto } from './dto/login-investor.dto';
import { InvestorJwtGuard } from './investor-jwt.guard';
import { AuditAs } from '../common/decorators/audit-domain.decorator';
import { InvestorEmail } from './investor.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  InvestorAuthResult,
  InvestorPublic,
  InvestorStatus,
} from './dto/investor.response.dto';

@ApiTags('investor')
@Controller('investor')
@AuditAs('investor')
export class InvestorController {
  constructor(private readonly service: InvestorService) {}

  // Public self-service registration and login for website investors. Both are
  // internet-reachable unauthenticated writes, so they get the same tightened
  // 5/min limit as AuthController.login and the waitlist create.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: InvestorAuthResult })
  @Post('register')
  register(@Body() dto: RegisterInvestorDto) {
    return this.service.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: InvestorAuthResult })
  @Post('login')
  login(@Body() dto: LoginInvestorDto) {
    return this.service.login(dto);
  }

  // Guarded by the investor token (typ='investor', INVESTOR_JWT_SECRET).
  @UseGuards(InvestorJwtGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: InvestorPublic })
  @Get('me')
  me(@InvestorEmail() email: string) {
    return this.service.me(email);
  }

  @UseGuards(InvestorJwtGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: InvestorStatus })
  @Get('status')
  status(@InvestorEmail() email: string) {
    return this.service.status(email);
  }
}
