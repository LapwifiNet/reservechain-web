import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get('programs')
  programs() {
    return this.service.programs();
  }

  @Get('programs/:code')
  program(@Param('code') code: string) {
    return this.service.program(code.toUpperCase());
  }

  @Get('registry')
  registry(@Query('take') take?: string) {
    return this.service.registry(take ? Number(take) : 100);
  }
}
