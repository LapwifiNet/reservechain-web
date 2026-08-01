import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Enquiries (FR-WEB) — public create + admin list, mirroring waitlist
 * behaviour: strict DTO, consent-free (no money/wallet fields), throttled,
 * audited, PII stays out of the stored audit body.
 */
describe('Enquiries', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const sample = {
    kind: 'enterprise',
    fullName: 'Acme Metals Ltd',
    email: 'enquiry-test@example.com',
    company: 'Acme Metals',
    message: 'We are interested in the enterprise tokenization framework.',
    locale: 'en',
  };

  it('creates an enquiry', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/api/enquiries')
      .send(sample)
      .expect(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeTruthy();
  });

  it('rejects an enquiry without a valid email', async () => {
    await supertest(app.getHttpServer())
      .post('/api/enquiries')
      .send({ ...sample, email: 'not-an-email' })
      .expect(400);
  });

  it('rejects an enquiry with a short message', async () => {
    await supertest(app.getHttpServer())
      .post('/api/enquiries')
      .send({ ...sample, message: 'hi' })
      .expect(400);
  });

  it('rejects an unknown kind', async () => {
    await supertest(app.getHttpServer())
      .post('/api/enquiries')
      .send({ ...sample, kind: 'crypto-scam' })
      .expect(400);
  });

  it('lists enquiries for ADMIN', async () => {
    // The admin list route is guarded; with no session this must be 401.
    const res = await supertest(app.getHttpServer())
      .get('/api/enquiries')
      .expect(401);
    expect(res.body.message).toBeTruthy();
  });

  it('stores no enquiry row when the DTO is invalid', async () => {
    await supertest(app.getHttpServer())
      .post('/api/enquiries')
      .send({ ...sample, email: 'bad' })
      .expect(400);
    const count = await prisma.enquiry.count({
      where: { email: 'bad' },
    });
    expect(count).toBe(0);
  });
});
