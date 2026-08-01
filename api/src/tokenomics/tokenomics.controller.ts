import { Controller, Get } from '@nestjs/common';
import { TokenomicsService } from './tokenomics.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TokenomicsResponse } from './dto/tokenomics.response.dto';

@ApiTags('tokenomics')
@Controller('tokenomics')
export class TokenomicsController {
  constructor(private readonly service: TokenomicsService) {}

  @ApiOkResponse({ type: TokenomicsResponse })
  @Get()
  get() {
    return this.service.get();
  }
}
