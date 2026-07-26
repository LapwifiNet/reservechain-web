import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvestorService } from './investor.service';
import { RegisterInvestorDto } from './dto/register-investor.dto';
import { LoginInvestorDto } from './dto/login-investor.dto';
import { InvestorJwtGuard } from './investor-jwt.guard';
import { InvestorEmail } from './investor.decorator';

@Controller('investor')
export class InvestorController {
  constructor(private readonly service: InvestorService) {}

  // Public self-service registration and login for website investors. Both are
  // internet-reachable unauthenticated writes, so they get the same tightened
  // 5/min limit as AuthController.login and the waitlist create.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterInvestorDto) {
    return this.service.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginInvestorDto) {
    return this.service.login(dto);
  }

  // Guarded by the investor token (typ='investor', INVESTOR_JWT_SECRET).
  @UseGuards(InvestorJwtGuard)
  @Get('me')
  me(@InvestorEmail() email: string) {
    return this.service.me(email);
  }

  @UseGuards(InvestorJwtGuard)
  @Get('status')
  status(@InvestorEmail() email: string) {
    return this.service.status(email);
  }
}
