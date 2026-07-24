import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AssetsModule } from './assets/assets.module';
import { PassportsModule } from './passports/passports.module';
import { TokenomicsModule } from './tokenomics/tokenomics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SensitiveModule } from './sensitive/sensitive.module';
import { ChainSyncModule } from './chain-sync/chain-sync.module';
import { AuthModule } from './auth/auth.module';
import { KycModule } from './kyc/kyc.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    WaitlistModule,
    AssetsModule,
    PassportsModule,
    TokenomicsModule,
    DashboardModule,
    SensitiveModule,
    ChainSyncModule,
    AuthModule,
    KycModule,
  ],
})
export class AppModule {}
