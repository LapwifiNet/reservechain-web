import { Controller, Get } from '@nestjs/common';
import { TokenomicsService } from './tokenomics.service';

@Controller('tokenomics')
export class TokenomicsController {
  constructor(private readonly service: TokenomicsService) {}

  @Get()
  get() {
    return this.service.get();
  }
}
