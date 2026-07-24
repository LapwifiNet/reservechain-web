import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly service: WaitlistService) {}

  @Post()
  create(@Body() dto: CreateWaitlistDto) {
    return this.service.create(dto);
  }

  @Get('count')
  async count() {
    return { count: await this.service.count() };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COMPLIANCE)
  @Get()
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 50);
  }
}
