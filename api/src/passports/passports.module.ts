import { Module } from '@nestjs/common';
import { PassportsController } from './passports.controller';
import { PassportsService } from './passports.service';

@Module({
  controllers: [PassportsController],
  providers: [PassportsService],
})
export class PassportsModule {}
