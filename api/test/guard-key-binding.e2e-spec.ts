import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Token-domain isolation must hold at EVERY mount point, not just the ones an
// earlier spec happened to sample.
//
// Nest instantiates `@UseGuards(...)` enhancers in the injector of the module
// declaring the controller, not the module exporting the guard. So a guard that
// inherits its key from the injected JwtService is correct only while every
// mounting module's imports happen to resolve the right JwtModule. That failed
// in exactly one place — InvestorJwtGuard in RedemptionModule accepted an
// admin-signed token on an investor route — and the two mount points the
// isolation spec sampled (KycModule, InvestorModule) were not the ones that
// broke.
//
// This suite therefore sweeps every module that mounts a token-verifying guard
// and asserts the shape that actually passed: a token carrying the CORRECT typ
// for the route, signed with the OTHER domain's secret. Both guards now bind
// their own key from ConfigService, so the answer must be 401 everywhere.
describe('Guards bind their own signing key at every mount point', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminSecret: string;
  let investorSecret: string;

  // Admin-domain mount points: module → a route it protects with JwtAuthGuard.
  // Gated modules are included with their flags on, so the request reaches the
  // guard rather than stopping at FeatureFlagGuard.
  const ADMIN_MOUNTS: Array<[string, string, string]> = [
    ['WaitlistModule', 'get', '/api/waitlist'],
    ['KycModule', 'get', '/api/kyc/cases'],
    ['AuthModule', 'get', '/api/auth/me'],
    ['DashboardModule', 'get', '/api/dashboard/stats'],
    ['AuditModule', 'get', '/api/audit'],
    ['ProofOfReservesModule', 'get', '/api/por/attestations'],
    ['RedemptionModule', 'get', '/api/redemption/requests'],
  ];

  // Investor-domain mount points, protected by InvestorJwtGuard.
  const INVESTOR_MOUNTS: Array<[string, string, string]> = [
    ['InvestorModule', 'get', '/api/investor/me'],
    ['InvestorModule', 'get', '/api/investor/status'],
    ['RedemptionModule', 'get', '/api/redemption/requests/mine'],
  ];

  const call = (method: string, path: string, token: string) =>
    (supertest(app.getHttpServer()) as Record<string, any>)
      [method](path)
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    process.env.INVESTOR_JWT_SECRET =
      process.env.INVESTOR_JWT_SECRET ||
      'spec-investor-secret-at-least-32-characters';
    // Gated modules on, so their guards are actually exercised.
    process.env.PROOF_OF_RESERVES_ENABLED = 'true';
    process.env.REDEMPTION_ENABLED = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const config = app.get<ConfigService>(ConfigService);
    adminSecret = config.get<string>('JWT_SECRET') as string;
    investorSecret = config.get<string>('INVESTOR_JWT_SECRET') as string;
    expect(adminSecret).toBeTruthy();
    expect(investorSecret).not.toBe(adminSecret);
  });

  afterAll(async () => {
    process.env.PROOF_OF_RESERVES_ENABLED = 'false';
    process.env.REDEMPTION_ENABLED = 'false';
    await prisma.$disconnect();
    await app.close();
  });

  const sign = (secret: string, payload: Record<string, unknown>) =>
    new JwtService({ secret }).signAsync(payload);

  describe('admin mount points reject a token signed with the investor key', () => {
    it.each(ADMIN_MOUNTS)(
      '%s — %s %s rejects typ=admin signed with INVESTOR_JWT_SECRET',
      async (_module, method, path) => {
        const forged = await sign(investorSecret, {
          sub: 'forged',
          email: 'admin@openrwa.local',
          role: 'ADMIN',
          typ: 'admin',
        });
        const res = await call(method, path, forged);
        expect(res.status).toBe(401);
      },
    );

    it.each(ADMIN_MOUNTS)(
      '%s — %s %s accepts a correctly signed admin token',
      async (_module, method, path) => {
        const genuine = await sign(adminSecret, {
          sub: 'spec-admin',
          email: 'spec-keybind-admin@example.local',
          role: 'ADMIN',
          typ: 'admin',
        });
        const res = await call(method, path, genuine);
        // 200 on live routes; 501 on the gated ones, whose service refuses
        // after the guard has accepted. Never 401 — that would mean the guard
        // rejected a valid admin token.
        expect([200, 501]).toContain(res.status);
      },
    );
  });

  describe('investor mount points reject a token signed with the admin key', () => {
    it.each(INVESTOR_MOUNTS)(
      '%s — %s %s rejects typ=investor signed with JWT_SECRET',
      async (_module, method, path) => {
        const forged = await sign(adminSecret, {
          sub: 'forged',
          email: 'spec-keybind-investor@example.local',
          typ: 'investor',
        });
        const res = await call(method, path, forged);
        expect(res.status).toBe(401);
      },
    );

    it.each(INVESTOR_MOUNTS)(
      '%s — %s %s accepts a correctly signed investor token',
      async (_module, method, path) => {
        const genuine = await sign(investorSecret, {
          sub: 'spec-investor',
          email: 'spec-keybind-investor@example.local',
          typ: 'investor',
        });
        const res = await call(method, path, genuine);
        // The property under test is that the GUARD accepted the token, which
        // is not the same as the request succeeding: /investor/me legitimately
        // answers 401 investor_not_found for an account that was never
        // registered. Only the guard emits invalid_token, so that is what must
        // be absent — this is the failure mode that revealed the
        // RedemptionModule bug.
        expect(res.body?.message).not.toBe('invalid_token');
      },
    );
  });
});
