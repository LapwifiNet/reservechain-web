import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Pins down the rule that a KYC write must be attributable to a named
// compliance officer. The suite deliberately runs with SERVICE_API_TOKEN and
// API_TOKEN both set, so a regression that reintroduces the shared-service-token
// fallback fails here instead of passing silently.
describe('KYC writes reject the shared service token', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let serviceToken: string;
  let userToken: string;
  let caseId: string;

  // Clearly illustrative fixtures — no real or realistic personal data.
  const REVIEWER_EMAIL = 'spec-reviewer@example.local';
  const REVIEWER_PASSWORD = 'spec-only-not-a-real-secret';
  const SUBJECT_NAME = 'Illustrative Subject — Service Token Spec';

  beforeAll(async () => {
    // Both credentials present for the whole suite.
    process.env.SERVICE_API_TOKEN =
      process.env.SERVICE_API_TOKEN ||
      'spec-service-token-at-least-32-characters-long';
    process.env.API_TOKEN = process.env.SERVICE_API_TOKEN;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const configService = app.get<ConfigService>(ConfigService);
    serviceToken = configService.get<string>('SERVICE_API_TOKEN') as string;

    // Guard the premise: without both set, the assertions below prove nothing.
    expect(serviceToken).toBeTruthy();
    expect(process.env.API_TOKEN).toBeTruthy();

    await prisma.adminUser.upsert({
      where: { email: REVIEWER_EMAIL },
      update: { passwordHash: await bcryptjs.hash(REVIEWER_PASSWORD, 10) },
      create: {
        email: REVIEWER_EMAIL,
        passwordHash: await bcryptjs.hash(REVIEWER_PASSWORD, 10),
        role: 'COMPLIANCE',
      },
    });

    const login = await supertest(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: REVIEWER_EMAIL, password: REVIEWER_PASSWORD })
      .expect(201);
    userToken = login.body.accessToken;

    // A case for the review assertions, created by the signed-in user.
    const created = await supertest(app.getHttpServer())
      .post('/api/kyc/cases')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ subjectType: 'person', legalName: SUBJECT_NAME, country: 'SG' })
      .expect(201);
    caseId = created.body.id;
  });

  afterAll(async () => {
    await prisma.kycCase.deleteMany({ where: { legalName: SUBJECT_NAME } });
    await prisma.adminUser.deleteMany({ where: { email: REVIEWER_EMAIL } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('writes without a user session', () => {
    it('rejects POST /api/kyc/cases with no credentials', () => {
      return supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .send({
          subjectType: 'person',
          legalName: SUBJECT_NAME,
          country: 'SG',
        })
        .expect(401);
    });

    it('rejects POST /api/kyc/cases with only the service token', () => {
      return supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${serviceToken}`)
        .send({
          subjectType: 'person',
          legalName: SUBJECT_NAME,
          country: 'SG',
        })
        .expect(401);
    });

    it('rejects POST /api/kyc/cases/:id/review with only the service token', () => {
      return supertest(app.getHttpServer())
        .post(`/api/kyc/cases/${caseId}/review`)
        .set('Authorization', `Bearer ${serviceToken}`)
        .send({ status: 'approved', riskLevel: 'low' })
        .expect(401);
    });
  });

  describe('writes with a valid user session', () => {
    it('allows creating a case', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ subjectType: 'entity', legalName: SUBJECT_NAME, country: 'GB' })
        .expect(201);
      expect(res.body.id).toBeTruthy();
    });

    it('allows recording a review and attributes it to that user', async () => {
      const res = await supertest(app.getHttpServer())
        .post(`/api/kyc/cases/${caseId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'approved', riskLevel: 'low' })
        .expect(201);

      expect(res.body.reviewedBy).toBe(REVIEWER_EMAIL);
      expect(res.body.reviewedBy).not.toBe('service@reservechain');

      const stored = await prisma.kycCase.findUnique({ where: { id: caseId } });
      expect(stored?.reviewedBy).toBe(REVIEWER_EMAIL);
    });
  });

  describe('reads are deliberately still allowed', () => {
    it('allows GET /api/kyc/cases with the service token', () => {
      return supertest(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${serviceToken}`)
        .expect(200);
    });
  });
});
