import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';

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
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    configService = app.get<ConfigService>(ConfigService);
    // Construct the signer explicitly: since P8 the app has TWO JwtModule
    // registrations (admin and investor domains), so app.get(JwtService) is
    // ambiguous. These are admin-domain tokens, signed with JWT_SECRET.
    jwtService = new JwtService({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: '1h' },
    });

    // Seed test data
    const adminPassword = await bcryptjs.hash('test-admin-pass', 10);
    const compliancePassword = await bcryptjs.hash('test-compliance-pass', 10);
    const viewerPassword = await bcryptjs.hash('test-viewer-pass', 10);

    await prisma.adminUser.createMany({
      data: [
        { email: 'test-admin@example.local', passwordHash: adminPassword, role: 'ADMIN' },
        { email: 'test-compliance@example.local', passwordHash: compliancePassword, role: 'COMPLIANCE' },
        { email: 'test-viewer@example.local', passwordHash: viewerPassword, role: 'VIEWER' },
      ],
      skipDuplicates: true,
    });

    // Generate tokens
    adminToken = await jwtService.signAsync({
      sub: 'test-admin-id',
      email: 'test-admin@example.local',
      role: 'ADMIN',
      typ: 'admin',
    });

    complianceToken = await jwtService.signAsync({
      sub: 'test-compliance-id',
      email: 'test-compliance@example.local',
      role: 'COMPLIANCE',
      typ: 'admin',
    });

    viewerToken = await jwtService.signAsync({
      sub: 'test-viewer-id',
      email: 'test-viewer@example.local',
      role: 'VIEWER',
      typ: 'admin',
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
          email: `test-${Date.now()}@example.com`,
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
        .send({ email: 'test-admin@example.local', password: 'test-admin-pass' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user).toHaveProperty('email', 'test-admin@example.local');
          expect(res.body.user).toHaveProperty('role', 'ADMIN');
        });
    });

    it('POST /api/auth/login should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-admin@example.local', password: 'wrong-password' })
        .expect(401);
    });

    it('GET /api/auth/me should return user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'test-admin@example.local');
          expect(res.body).toHaveProperty('role', 'ADMIN');
        });
    });

    it('GET /api/auth/me should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('JWT_SECRET validation', () => {
    // The JwtModule factory validates JWT_SECRET while the module graph is
    // instantiated, so the rejection surfaces from compile(), not init().
    // An empty value (rather than `delete`) is required because ConfigModule
    // repopulates a deleted key from the .env file.
    it('should refuse to start with missing JWT_SECRET', async () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = '';

      try {
        await expect(
          Test.createTestingModule({ imports: [AppModule] }).compile(),
        ).rejects.toThrow(
          'JWT_SECRET must be set and at least 32 characters long',
        );
      } finally {
        process.env.JWT_SECRET = originalJwtSecret;
      }
    });

    it('should refuse to start with weak JWT_SECRET (< 32 chars)', async () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'short-secret';

      try {
        await expect(
          Test.createTestingModule({ imports: [AppModule] }).compile(),
        ).rejects.toThrow(
          'JWT_SECRET must be set and at least 32 characters long',
        );
      } finally {
        process.env.JWT_SECRET = originalJwtSecret;
      }
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

    it('POST /api/kyc/cases/:id/screen should return stub response', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Screen Test Person',
          country: 'US',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post(`/api/kyc/cases/${created.body.id}/screen`)
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
