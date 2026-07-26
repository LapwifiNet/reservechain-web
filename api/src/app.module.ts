import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { AuditModule } from './audit/audit.module';
import { InvestorModule } from './investor/investor.module';
import { ProofOfReservesModule } from './proof-of-reserves/proof-of-reserves.module';
import { RedemptionModule } from './redemption/redemption.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    // Baseline limit for general API traffic. Sensitive routes tighten this
    // with a dedicated @Throttle (see AuthController.login at 5/min).
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
    AuditModule,
    // P8: public investor portal (own token domain, read-only status).
    InvestorModule,
    // P11/P12: gated and inactive. Flag-gated at the class level AND refusing
    // in the service, so neither is an implementation waiting for a switch.
    ProofOfReservesModule,
    RedemptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
