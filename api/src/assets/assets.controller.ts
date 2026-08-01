import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AssetProgramDetail,
  AssetProgramSummary,
  AssetRecordWithProgram,
} from './dto/assets.response.dto';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @ApiOkResponse({ type: [AssetProgramSummary] })
  @Get('programs')
  programs() {
    return this.service.programs();
  }

  @ApiOkResponse({ type: AssetProgramDetail })
  @Get('programs/:code')
  program(@Param('code') code: string) {
    return this.service.program(code.toUpperCase());
  }

  @ApiOkResponse({ type: [AssetRecordWithProgram] })
  @Get('registry')
  registry(@Query('take') take?: string) {
    return this.service.registry(take ? Number(take) : 100);
  }
}
