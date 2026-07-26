import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthModule } from '../../src/auth/auth.module';
import { InvestorModule } from '../../src/investor/investor.module';
import { KycModule } from '../../src/kyc/kyc.module';
import { AuditModule } from '../../src/audit/audit.module';
import { AuditInterceptor } from '../../src/audit/audit.interceptor';
import { createPrismaMock, PrismaMock } from './prisma-mock';

export type TestContext = {
  app: INestApplication;
  prisma: PrismaMock;
  /** Signs/verifies admin-domain tokens (JWT_SECRET). */
  adminJwt: JwtService;
  /** Signs/verifies investor-domain tokens (INVESTOR_JWT_SECRET). */
  investorJwt: JwtService;
  adminToken: string;
  complianceToken: string;
  investorToken: (email?: string) => Promise<string>;
};

/**
 * Boots a Nest application wired like production — global 'api' prefix,
 * ValidationPipe({ whitelist, transform }) and the global AuditInterceptor —
 * but with PrismaService swapped for an in-memory mock. Only the modules under
 * test are imported, keeping the suite fast and free of chain-sync side
 * effects.
 *
 * Adapted from the p8tests overlay for the current token model:
 * - JWT_SECRET and INVESTOR_JWT_SECRET are both required, >= 32 chars and
 *   different (InvestorModule refuses to start otherwise);
 * - tokens carry an explicit typ ('admin' / 'investor') and are signed with
 *   their own domain's secret via explicitly constructed JwtService instances.
 *   app.get(JwtService) is deliberately not used: with two JwtModule
 *   registrations it is ambiguous;
 * - admin roles are the uppercase Role enum values RolesGuard compares.
 */
export async function createTestApp(): Promise<TestContext> {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-admin-secret-at-least-32-characters!!';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
  process.env.INVESTOR_JWT_SECRET =
    process.env.INVESTOR_JWT_SECRET ||
    'test-investor-secret-at-least-32-characters';

  const prisma = createPrismaMock();

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      PrismaModule,
      AuthModule,
      InvestorModule,
      KycModule,
      AuditModule,
    ],
    providers: [
      // Mirrors AppModule so audited mutations behave as in production.
      { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const adminJwt = new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });
  const investorJwt = new JwtService({
    secret: process.env.INVESTOR_JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });

  const adminToken = await adminJwt.signAsync({
    sub: 'admin-1',
    email: 'admin@reservechain.local',
    role: 'ADMIN',
    typ: 'admin',
  });
  const complianceToken = await adminJwt.signAsync({
    sub: 'comp-1',
    email: 'compliance@reservechain.local',
    role: 'COMPLIANCE',
    typ: 'admin',
  });
  const investorToken = (email = 'investor@example.com') =>
    investorJwt.signAsync({ sub: 'inv-1', email, typ: 'investor' });

  return {
    app,
    prisma,
    adminJwt,
    investorJwt,
    adminToken,
    complianceToken,
    investorToken,
  };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
