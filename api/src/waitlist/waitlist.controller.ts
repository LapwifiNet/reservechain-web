import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

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

  // TODO(P6/P9): guard with authentication + RBAC before exposing publicly.
  @Get()
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 50);
  }
}
