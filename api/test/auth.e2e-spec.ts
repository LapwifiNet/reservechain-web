import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('Auth and RBAC (P6)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let adminToken: string;
  let complianceToken: string;
  let viewerToken: string;
  let serviceToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    configService = app.get<ConfigService>(ConfigService);

    // Seed test data
    const adminPassword = await bcrypt.hash('test-admin-pass', 10);
    const compliancePassword = await bcrypt.hash('test-compliance-pass', 10);
    const viewerPassword = await bcrypt.hash('test-viewer-pass', 10);

    await prisma.adminUser.createMany({
      data: [
        { email: 'test-admin@local', passwordHash: adminPassword, role: 'admin' },
        { email: 'test-compliance@local', passwordHash: compliancePassword, role: 'compliance' },
        { email: 'test-viewer@local', passwordHash: viewerPassword, role: 'viewer' },
      ],
      skipDuplicates: true,
    });

    // Generate tokens
    adminToken = await jwtService.signAsync({
      sub: 'test-admin-id',
      email: 'test-admin@local',
      role: 'admin',
    });

    complianceToken = await jwtService.signAsync({
      sub: 'test-compliance-id',
      email: 'test-compliance@local',
      role: 'compliance',
    });

    viewerToken = await jwtService.signAsync({
      sub: 'test-viewer-id',
      email: 'test-viewer@local',
      role: 'viewer',
    });

    serviceToken = configService.get<string>('SERVICE_API_TOKEN') || 'test-service-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Public endpoints (no auth required)', () => {
    it('GET /api/health should be public', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });

    it('POST /api/waitlist should be public', () => {
      return request(app.getHttpServer())
        .post('/api/waitlist')
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          investorType: 'investor',
          consent: true,
        })
        .expect(201);
    });

    it('GET /api/waitlist/count should be public', () => {
      return request(app.getHttpServer()).get('/api/waitlist/count').expect(200);
    });

    it('GET /api/assets/programs should be public', () => {
      return request(app.getHttpServer()).get('/api/assets/programs').expect(200);
    });

    it('GET /api/assets/registry should be public', () => {
      return request(app.getHttpServer()).get('/api/assets/registry').expect(200);
    });

    it('GET /api/passports should be public', () => {
      return request(app.getHttpServer()).get('/api/passports').expect(200);
    });

    it('GET /api/tokenomics should be public', () => {
      return request(app.getHttpServer()).get('/api/tokenomics').expect(200);
    });
  });

  describe('Protected endpoints require authentication', () => {
    it('GET /api/waitlist should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/waitlist').expect(401);
    });

    it('GET /api/dashboard/stats should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/dashboard/stats').expect(401);
    });

    it('GET /api/kyc/cases should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/kyc/cases').expect(401);
    });
  });

  describe('RBAC: viewer role restrictions', () => {
    it('GET /api/waitlist should return 403 for viewer role', () => {
      return request(app.getHttpServer())
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('GET /api/dashboard/stats should return 403 for viewer role', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('GET /api/kyc/cases should return 403 for viewer role', () => {
      return request(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });
  });

  describe('RBAC: admin and compliance roles have access', () => {
    it('GET /api/waitlist should return 200 for admin', () => {
      return request(app.getHttpServer())
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/waitlist should return 200 for compliance', () => {
      return request(app.getHttpServer())
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${complianceToken}`)
        .expect(200);
    });

    it('GET /api/dashboard/stats should return 200 for admin', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/dashboard/stats should return 200 for compliance', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${complianceToken}`)
        .expect(200);
    });

    it('GET /api/kyc/cases should return 200 for admin', () => {
      return request(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/kyc/cases should return 200 for compliance', () => {
      return request(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${complianceToken}`)
        .expect(200);
    });
  });

  describe('Service token grants admin access', () => {
    it('GET /api/waitlist should return 200 with service token', () => {
      return request(app.getHttpServer())
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${serviceToken}`)
        .expect(200);
    });

    it('GET /api/dashboard/stats should return 200 with service token', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${serviceToken}`)
        .expect(200);
    });

    it('GET /api/kyc/cases should return 200 with service token', () => {
      return request(app.getHttpServer())
        .get('/api/kyc/cases')
        .set('Authorization', `Bearer ${serviceToken}`)
        .expect(200);
    });
  });

  describe('Auth endpoints', () => {
    it('POST /api/auth/login should return token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-admin@local', password: 'test-admin-pass' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user).toHaveProperty('email', 'test-admin@local');
          expect(res.body.user).toHaveProperty('role', 'admin');
        });
    });

    it('POST /api/auth/login should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-admin@local', password: 'wrong-password' })
        .expect(401);
    });

    it('GET /api/auth/me should return user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'test-admin@local');
          expect(res.body).toHaveProperty('role', 'admin');
        });
    });

    it('GET /api/auth/me should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('KYC module endpoints', () => {
    it('POST /api/kyc/cases should create case with admin token', () => {
      return request(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Test Person',
          country: 'US',
        })
        .expect(201);
    });

    it('POST /api/kyc/cases/:id/screen should return stub response', () => {
      return request(app.getHttpServer())
        .post('/api/kyc/cases/test-id/screen')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('provider', 'stub');
          expect(res.body).toHaveProperty('result', 'clear');
          expect(res.body.note).toContain('Illustrative');
        });
    });
  });
});
