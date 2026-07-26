import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// P8: the investor and admin token domains are disjoint, both ways.
//
// Investor tokens are signed with INVESTOR_JWT_SECRET and carry typ='investor';
// admin tokens are signed with JWT_SECRET and carry typ='admin'. JwtAuthGuard
// accepts only the latter, InvestorJwtGuard only the former, and a token with
// no typ at all is refused on both sides — nothing defaults into a domain.
// The suite runs with both secrets set (and different), so every cross-domain
// assertion exercises the signature wall as well as the claim wall.
describe('P8 investor portal: the token domains are disjoint', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let investorToken: string;
  let adminSecret: string;
  let investorSecret: string;

  // Clearly illustrative fixtures — no real or realistic personal data.
  const ADMIN_EMAIL = 'spec-isolation-admin@example.local';
  const ADMIN_PASSWORD = 'spec-only-not-a-real-secret';
  const INVESTOR_EMAIL = 'spec-isolation-investor@example.local';
  const INVESTOR_PASSWORD = 'spec-only-not-a-real-secret';
  const INVESTOR_NAME = 'Illustrative Investor — Isolation Spec';

  beforeAll(async () => {
    process.env.SERVICE_API_TOKEN =
      process.env.SERVICE_API_TOKEN ||
      'spec-service-token-at-least-32-characters-long';
    process.env.INVESTOR_JWT_SECRET =
      process.env.INVESTOR_JWT_SECRET ||
      'spec-investor-secret-at-least-32-characters-long';

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

    // Guard the premise: with a missing or shared secret the cross-domain
    // rejections below would prove much less than they claim to.
    expect(adminSecret).toBeTruthy();
    expect(investorSecret).toBeTruthy();
    expect(investorSecret).not.toBe(adminSecret);

    // Admin side: seed a user and log in for a real admin-domain token.
    const bcryptjs = await import('bcryptjs');
    await prisma.adminUser.upsert({
      where: { email: ADMIN_EMAIL },
      update: { passwordHash: await bcryptjs.hash(ADMIN_PASSWORD, 10) },
      create: {
        email: ADMIN_EMAIL,
        passwordHash: await bcryptjs.hash(ADMIN_PASSWORD, 10),
        role: 'ADMIN',
      },
    });
    const adminLogin = await supertest(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(201);
    adminToken = adminLogin.body.accessToken;

    // Investor side: self-register for a real investor-domain token.
    const registered = await supertest(app.getHttpServer())
      .post('/api/investor/register')
      .send({
        fullName: INVESTOR_NAME,
        email: INVESTOR_EMAIL,
        password: INVESTOR_PASSWORD,
      })
      .expect(201);
    investorToken = registered.body.accessToken;
    expect(investorToken).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.kycCase.deleteMany({
      where: { legalName: 'Illustrative Audit Probe — P8 Email Link' },
    });
    await prisma.investorUser.deleteMany({ where: { email: INVESTOR_EMAIL } });
    await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('each token works on its own side', () => {
    it('admin token passes GET /api/auth/me', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.email).toBe(ADMIN_EMAIL);
    });

    it('admin token passes the @Roles-guarded GET /api/kyc/cases', () => {
      return supertest(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('investor token passes GET /api/investor/me', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/investor/me')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);
      expect(res.body.email).toBe(INVESTOR_EMAIL);
      expect(res.body.fullName).toBe(INVESTOR_NAME);
    });

    it('investor token passes GET /api/investor/status with the documented shape', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/investor/status')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);
      expect(res.body.profile.email).toBe(INVESTOR_EMAIL);
      expect(res.body.kyc.status).toBe('not_started');
      expect(res.body.kyc.sanctions).toBe('not_screened');
      expect(Array.isArray(res.body.programs)).toBe(true);
    });
  });

  describe('an investor token is refused on the admin side', () => {
    it('GET /api/auth/me (JwtAuthGuard, no @Roles) → 401', () => {
      return supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(401);
    });

    it('GET /api/kyc/cases (@Roles admin route) → 401', () => {
      return supertest(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(401);
    });

    it('POST /api/kyc/cases (admin write) → 401 and nothing is written', async () => {
      await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Illustrative Subject — Refused Investor Write',
          country: 'SG',
        })
        .expect(401);
      const stored = await prisma.kycCase.findMany({
        where: { legalName: 'Illustrative Subject — Refused Investor Write' },
      });
      expect(stored).toHaveLength(0);
    });
  });

  describe('an admin token is refused on the investor side', () => {
    it('GET /api/investor/me → 401', () => {
      return supertest(app.getHttpServer())
        .get('/api/investor/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(401);
    });

    it('GET /api/investor/status → 401', () => {
      return supertest(app.getHttpServer())
        .get('/api/investor/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(401);
    });
  });

  describe('forged and legacy tokens are refused on both sides', () => {
    it('an admin-secret token with NO typ is refused (no default into the admin domain)', async () => {
      const legacy = await new JwtService({ secret: adminSecret }).signAsync({
        sub: 'legacy-id',
        email: ADMIN_EMAIL,
        role: 'ADMIN',
      });
      await supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${legacy}`)
        .expect(401);
    });

    it('an investor-secret token claiming typ=admin fails the admin signature wall', async () => {
      const forged = await new JwtService({ secret: investorSecret }).signAsync({
        sub: 'forged-id',
        email: ADMIN_EMAIL,
        role: 'ADMIN',
        typ: 'admin',
      });
      await supertest(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it('an admin-secret token claiming typ=investor fails the investor signature wall', async () => {
      const forged = await new JwtService({ secret: adminSecret }).signAsync({
        sub: 'forged-id',
        email: INVESTOR_EMAIL,
        typ: 'investor',
      });
      await supertest(app.getHttpServer())
        .get('/api/investor/me')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });
  });

  describe('no investor credential can reach the audit trail', () => {
    it('records no audit event at all for investor register/login', async () => {
      // AuditInterceptor deliberately records only mutating requests on
      // ROLE-GUARDED routes. The public investor register/login routes carry
      // no @Roles, so their bodies — password included — never reach the audit
      // log in any form, which is stronger than redaction. Pinned here so a
      // future change that starts recording them has to face this spec.
      const events = await prisma.auditEvent.findMany({
        where: { action: { contains: 'investor' } },
      });
      expect(events).toHaveLength(0);
    });

    it('redacts the investor email on the role-guarded KYC create that links it', async () => {
      // P8 adds an optional investor-email link on KycCase. That route IS
      // role-guarded and therefore audited — prove the email is treated
      // exactly like the KYC subject name (the leak class fixed in f2487b7).
      await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Illustrative Audit Probe — P8 Email Link',
          country: 'SG',
          email: INVESTOR_EMAIL,
        })
        .expect(201);

      // Since the concatMap fix the audit write commits before the response
      // returns; the loop only locates this test's event among events other
      // tests create, not to tolerate timing.
      let event: Record<string, any> | undefined;
      for (let attempt = 0; attempt < 30 && !event; attempt++) {
        const res = await supertest(app.getHttpServer())
          .get('/api/audit?action=create.kyc&take=20')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
        event = res.body.events.find((e: Record<string, any>) => {
          const b = e?.metadata?.body;
          return b?.email && b?.subjectType === 'person' && b?.country === 'SG';
        });
        if (!event) await new Promise((r) => setTimeout(r, 150));
      }
      expect(event).toBeDefined();
      const body = event?.metadata?.body as Record<string, unknown>;
      expect(body.email).toBe('[PII_REDACTED]');
      expect(body.legalName).toBe('[PII_REDACTED]');
    });
  });

  describe('investor login is throttled like the other public writes', () => {
    it('returns 429 after the 5/min budget is spent', async () => {
      // 5 attempts pass the throttler (they fail auth with 401), the 6th is
      // refused by the throttler itself.
      for (let i = 0; i < 5; i++) {
        await supertest(app.getHttpServer())
          .post('/api/investor/login')
          .send({ email: INVESTOR_EMAIL, password: 'wrong-password-attempt' })
          .expect(401);
      }
      await supertest(app.getHttpServer())
        .post('/api/investor/login')
        .send({ email: INVESTOR_EMAIL, password: 'wrong-password-attempt' })
        .expect(429);
    });
  });
});
