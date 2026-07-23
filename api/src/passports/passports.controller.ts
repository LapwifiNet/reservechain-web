import { Controller, Get, Param, Query } from '@nestjs/common';
import { PassportsService } from './passports.service';

@Controller('passports')
export class PassportsController {
  constructor(private readonly service: PassportsService) {}

  @Get()
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 100);
  }

  @Get(':passportId')
  byId(@Param('passportId') passportId: string) {
    return this.service.byId(passportId);
  }
}
