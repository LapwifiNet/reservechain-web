import { Module } from '@nestjs/common';
import { TokenomicsController } from './tokenomics.controller';
import { TokenomicsService } from './tokenomics.service';

@Module({
  controllers: [TokenomicsController],
  providers: [TokenomicsService],
})
export class TokenomicsModule {}
