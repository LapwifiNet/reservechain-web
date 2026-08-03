import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { ReconcileModule } from './reconcile/reconcile.module';
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
import { WalletModule } from './wallet/wallet.module';
import { PurchaseModule } from './purchase/purchase.module';
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
        // Track the visitor, not the immediate peer. The public website proxies
        // waitlist signups through its own server (src/app/api/waitlist/route.ts)
        // and forwards the visitor's real address in the first X-Forwarded-For
        // hop; without this, every web visitor would share one throttle bucket
        // (the web container's IP) and the whole site would be limited to 5
        // signups per minute. Mobile calls the API directly, so it has no
        // X-Forwarded-For header and falls back to req.ip, the real client
        // address. The header is only trusted because the web proxy overwrites
        // it — a client-supplied value is never forwarded.
        getTracker: (req) => {
          const fwd = req.headers?.['x-forwarded-for'];
          if (typeof fwd === 'string' && fwd.trim()) {
            return fwd.split(',')[0].trim();
          }
          return req.ip ?? 'unknown';
        },
      },
    ]),
    PrismaModule,
    HealthModule,
    WaitlistModule,
    EnquiriesModule,
    ReconcileModule,
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
    WalletModule,
    PurchaseModule,
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
