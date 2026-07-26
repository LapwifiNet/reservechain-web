import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// P11/P12 are gated AND inert. Two separate properties, pinned separately:
//
//  1. With the flags off, every route refuses at FeatureFlagGuard with 501 and
//     `module_disabled`, before authentication is even considered.
//  2. The flag is not the only wall. AGENTS §2 forbids wiring a gated module to
//     real logic "even behind a feature flag that defaults on", so the services
//     refuse too — the suite flips both flags on and asserts the routes STILL
//     refuse. A future change that reinstates the overlay's working
//     implementation fails here rather than shipping a live reserve-coverage
//     claim behind one environment variable.
//
// Also pins invariant 34: the redemption module's investor guard must verify
// with INVESTOR_JWT_SECRET. It previously resolved AuthModule's admin signer,
// so an admin-signed token carrying typ:'investor' passed.
describe('P11/P12 gated modules stay inert', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let investorToken: string;
  let adminSignedInvestorToken: string;

  const flagsBefore = {
    por: process.env.PROOF_OF_RESERVES_ENABLED,
    redemption: process.env.REDEMPTION_ENABLED,
  };

  // Every route the two modules expose.
  const ROUTES: Array<[string, string, () => string]> = [
    ['get', '/api/por/status', () => ''],
    ['get', '/api/por/attestations', () => adminToken],
    ['post', '/api/por/attestations', () => adminToken],
    ['post', '/api/por/attestations/some-id/publish', () => adminToken],
    ['post', '/api/redemption/requests', () => investorToken],
    ['get', '/api/redemption/requests/mine', () => investorToken],
    ['get', '/api/redemption/requests', () => adminToken],
    ['post', '/api/redemption/requests/some-id/approve', () => adminToken],
    ['post', '/api/redemption/requests/some-id/reject', () => adminToken],
    ['post', '/api/redemption/requests/some-id/settle', () => adminToken],
  ];

  const call = (method: string, path: string, token: string) => {
    const req = (supertest(app.getHttpServer()) as Record<string, any>)[method](
      path,
    );
    if (token) req.set('Authorization', `Bearer ${token}`);
    return method === 'post' ? req.send({}) : req;
  };

  beforeAll(async () => {
    process.env.INVESTOR_JWT_SECRET =
      process.env.INVESTOR_JWT_SECRET ||
      'spec-investor-secret-at-least-32-characters';
    // The suite controls the flags itself; start from off.
    process.env.PROOF_OF_RESERVES_ENABLED = 'false';
    process.env.REDEMPTION_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const config = app.get<ConfigService>(ConfigService);
    const adminSecret = config.get<string>('JWT_SECRET') as string;
    const investorSecret = config.get<string>('INVESTOR_JWT_SECRET') as string;
    expect(investorSecret).not.toBe(adminSecret);

    adminToken = await new JwtService({ secret: adminSecret }).signAsync({
      sub: 'spec-admin',
      email: 'spec-gated-admin@example.local',
      role: 'ADMIN',
      typ: 'admin',
    });
    investorToken = await new JwtService({ secret: investorSecret }).signAsync({
      sub: 'spec-investor',
      email: 'spec-gated-investor@example.local',
      typ: 'investor',
    });
    adminSignedInvestorToken = await new JwtService({
      secret: adminSecret,
    }).signAsync({
      sub: 'spec-investor',
      email: 'spec-gated-investor@example.local',
      typ: 'investor',
    });
  });

  afterAll(async () => {
    process.env.PROOF_OF_RESERVES_ENABLED = flagsBefore.por ?? 'false';
    process.env.REDEMPTION_ENABLED = flagsBefore.redemption ?? 'false';
    await prisma.$disconnect();
    await app.close();
  });

  describe('flags off: refused at the guard', () => {
    beforeAll(() => {
      process.env.PROOF_OF_RESERVES_ENABLED = 'false';
      process.env.REDEMPTION_ENABLED = 'false';
    });

    it.each(ROUTES)('%s %s → 501 module_disabled', async (method, path, tok) => {
      const res = await call(method, path, tok());
      expect(res.status).toBe(501);
      expect(res.body.error).toBe('module_disabled');
    });

    it('refuses before authentication is considered', async () => {
      // No credential at all, on a route that is otherwise ADMIN-only.
      const res = await call('get', '/api/redemption/requests', '');
      expect(res.status).toBe(501);
      expect(res.body.error).toBe('module_disabled');
    });
  });

  describe('flags on: the service still refuses (AGENTS §2)', () => {
    beforeAll(() => {
      process.env.PROOF_OF_RESERVES_ENABLED = 'true';
      process.env.REDEMPTION_ENABLED = 'true';
    });
    afterAll(() => {
      process.env.PROOF_OF_RESERVES_ENABLED = 'false';
      process.env.REDEMPTION_ENABLED = 'false';
    });

    it.each(ROUTES)('%s %s → still 501', async (method, path, tok) => {
      const res = await call(method, path, tok());
      // 501 from the service, or 400 where a DTO rejects the empty body first.
      // Never 2xx: no gated route may succeed on any code path.
      expect([400, 501]).toContain(res.status);
      if (res.status === 501) {
        expect(['proof_of_reserves_inactive', 'redemption_inactive']).toContain(
          res.body.error,
        );
      }
    });

    it('writes nothing: both gated tables stay empty', async () => {
      await call('post', '/api/por/attestations', adminToken).send({
        programCode: 'CP',
        circulatingSupply: 1000,
        verifiedReserve: 1000,
        method: 'illustrative-spec-method',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-06-30T00:00:00.000Z',
      });
      await call('post', '/api/redemption/requests', investorToken).send({
        programCode: 'CP',
        amount: 5,
      });

      expect(await prisma.reserveAttestation.count()).toBe(0);
      expect(await prisma.redemptionRequest.count()).toBe(0);
    });

    it('the service principal cannot write to a gated staff route (invariant 16)', async () => {
      const serviceToken = process.env.SERVICE_API_TOKEN as string;
      expect(serviceToken).toBeTruthy();
      const res = await call(
        'post',
        '/api/redemption/requests/some-id/approve',
        serviceToken,
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('service_principal_write_denied');
    });

    it('the investor guard verifies with INVESTOR_JWT_SECRET (invariant 34)', async () => {
      // typ:'investor' but signed with the ADMIN secret. This passed before the
      // module imported InvestorModule, because the guard resolved AuthModule's
      // JwtService and verified staff tokens on an investor route.
      const forged = await call(
        'get',
        '/api/redemption/requests/mine',
        adminSignedInvestorToken,
      );
      expect(forged.status).toBe(401);

      // The correctly signed one gets through the guard to the refusal.
      const genuine = await call(
        'get',
        '/api/redemption/requests/mine',
        investorToken,
      );
      expect(genuine.status).toBe(501);
      expect(genuine.body.error).toBe('redemption_inactive');
    });
  });
});
