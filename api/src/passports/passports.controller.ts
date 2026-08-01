import { Controller, Get, Param, Query } from '@nestjs/common';
import { PassportsService } from './passports.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PassportResponse } from './dto/passports.response.dto';

@ApiTags('passports')
@Controller('passports')
export class PassportsController {
  constructor(private readonly service: PassportsService) {}

  @ApiOkResponse({ type: [PassportResponse] })
  @Get()
  list(@Query('take') take?: string) {
    return this.service.list(take ? Number(take) : 100);
  }

  @ApiOkResponse({ type: PassportResponse })
  @Get(':passportId')
  byId(@Param('passportId') passportId: string) {
    return this.service.byId(passportId);
  }
}
