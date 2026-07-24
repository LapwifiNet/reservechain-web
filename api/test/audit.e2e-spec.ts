import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('Audit Log (P9)', () => {
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
        { email: 'test-admin-audit@local', passwordHash: adminPassword, role: 'admin' },
        { email: 'test-compliance-audit@local', passwordHash: compliancePassword, role: 'compliance' },
        { email: 'test-viewer-audit@local', passwordHash: viewerPassword, role: 'viewer' },
      ],
      skipDuplicates: true,
    });

    // Generate tokens
    adminToken = await jwtService.signAsync({
      sub: 'test-admin-audit-id',
      email: 'test-admin-audit@local',
      role: 'admin',
    });

    complianceToken = await jwtService.signAsync({
      sub: 'test-compliance-audit-id',
      email: 'test-compliance-audit@local',
      role: 'compliance',
    });

    viewerToken = await jwtService.signAsync({
      sub: 'test-viewer-audit-id',
      email: 'test-viewer-audit@local',
      role: 'viewer',
    });

    serviceToken = configService.get<string>('SERVICE_API_TOKEN') || 'test-service-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Chain verification', () => {
    it('should record events and verify chain integrity', async () => {
      // Clear existing audit events
      await prisma.auditEvent.deleteMany({});

      // Create several KYC cases to trigger audit events
      await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Test Person 1',
          country: 'US',
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'entity',
          legalName: 'Test Corp 1',
          country: 'SG',
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Test Person 2',
          country: 'GB',
        })
        .expect(201);

      // Verify the chain
      const verifyResponse = await supertest(app.getHttpServer())
        .get('/api/audit/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(verifyResponse.body.valid).toBe(true);
      expect(verifyResponse.body.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('Append-only enforcement', () => {
    it('should not expose any route to update audit records', () => {
      // Try PUT
      return supertest(app.getHttpServer())
        .put('/api/audit/test-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'modified' })
        .expect(404)
        .then(() =>
          // Try PATCH
          supertest(app.getHttpServer())
            .patch('/api/audit/test-id')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'modified' })
            .expect(404),
        )
        .then(() =>
          // Try DELETE
          supertest(app.getHttpServer())
            .delete('/api/audit/test-id')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(404),
        );
    });
  });

  describe('Access control', () => {
    it('GET /api/audit should return 401 without token', () => {
      return supertest(app.getHttpServer()).get('/api/audit').expect(401);
    });

    it('GET /api/audit should return 403 for viewer role', () => {
      return supertest(app.getHttpServer())
        .get('/api/audit')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('GET /api/audit should return 200 for admin', () => {
      return supertest(app.getHttpServer())
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/audit should return 200 for compliance', () => {
      return supertest(app.getHttpServer())
        .get('/api/audit')
        .set('Authorization', `Bearer ${complianceToken}`)
        .expect(200);
    });

    it('GET /api/audit should return 200 with service token', () => {
      return supertest(app.getHttpServer())
        .get('/api/audit')
        .set('Authorization', `Bearer ${serviceToken}`)
        .expect(200);
    });

    it('GET /api/audit/verify should return 401 without token', () => {
      return supertest(app.getHttpServer()).get('/api/audit/verify').expect(401);
    });

    it('GET /api/audit/verify should return 403 for viewer role', () => {
      return supertest(app.getHttpServer())
        .get('/api/audit/verify')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });
  });

  describe('Filtering and pagination', () => {
    beforeAll(async () => {
      // Ensure we have some audit events
      await supertest(app.getHttpServer())
        .post('/api/kyc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectType: 'person',
          legalName: 'Filter Test Person',
          country: 'US',
        })
        .expect(201);
    });

    it('should support pagination with skip and take', async () => {
      const response = await supertest(app.getHttpServer())
        .get('/api/audit?skip=0&take=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeLessThanOrEqual(10);
    });

    it('should support filtering by action', async () => {
      const response = await supertest(app.getHttpServer())
        .get('/api/audit?action=create.kyc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.events).toBeDefined();
      if (response.body.events.length > 0) {
        expect(response.body.events[0].action).toContain('create');
      }
    });

    it('should support filtering by resourceType', async () => {
      const response = await supertest(app.getHttpServer())
        .get('/api/audit?resourceType=kyc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.events).toBeDefined();
    });
  });

  describe('PII protection', () => {
    it('should not log email addresses in waitlist create events', async () => {
      await supertest(app.getHttpServer())
        .post('/api/waitlist')
        .send({
          fullName: 'PII Test User',
          email: 'pii-test@example.com',
          investorType: 'investor',
          consent: true,
        })
        .expect(201);

      // Get the latest audit event
      const auditResponse = await supertest(app.getHttpServer())
        .get('/api/audit?take=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (auditResponse.body.events.length > 0) {
        const latestEvent = auditResponse.body.events[0];
        const metadata = latestEvent.metadata as Record<string, unknown>;
        const body = metadata?.body as Record<string, unknown>;

        // Email should be redacted in the audit log
        if (body?.email) {
          expect(body.email).toBe('[PII_REDACTED]');
        }
      }
    });

    it('should not log passwords in auth events', async () => {
      // Login with a password
      await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-admin-audit@local',
          password: 'test-admin-pass',
        })
        .expect(201);

      // Check that no audit event contains the password
      const auditResponse = await supertest(app.getHttpServer())
        .get('/api/audit?take=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const event of auditResponse.body.events) {
        const metadata = event.metadata as Record<string, unknown>;
        const body = metadata?.body as Record<string, unknown>;

        if (body) {
          const bodyStr = JSON.stringify(body);
          expect(bodyStr).not.toContain('test-admin-pass');
        }
      }
    });
  });
});
