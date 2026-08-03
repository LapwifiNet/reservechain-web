import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Waitlist hardening (P-hardening):
 *
 * 1. Case-insensitive idempotency — Postgres UNIQUE is case-sensitive, so the
 *    service must normalise the address before the lookup. Without it,
 *    Foo@Bar.com and foo@bar.com are two rows and two confirmation mails.
 *
 * 2. Per-visitor throttling — the global tracker reads the first
 *    X-Forwarded-For hop (app.module.ts) so the public website proxy can
 *    forward the visitor's real address instead of collapsing every web
 *    visitor into the proxy's own bucket. These tests use TEST-NET-3
 *    addresses (203.0.113.0/24, RFC 5737) that no real client uses, so the
 *    buckets never collide with other suites' traffic (which has no header
 *    and is tracked by req.ip).
 *
 * 3. GET /waitlist/count is public and must have its own modest limit.
 */
describe('Waitlist hardening', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const stamp = Date.now();
  // Unique per run so a re-run can never hit a leftover row from a previous
  // run of this suite.
  const emails = [
    `hardening-${stamp}-a@example.local`,
    `hardening-${stamp}-b@example.local`,
    `hardening-${stamp}-c@example.local`,
    `hardening-${stamp}-d@example.local`,
    `hardening-${stamp}-e@example.local`,
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.waitlistEntry.deleteMany({
      where: { email: { in: emails } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  const signup = (email: string, ip?: string) => {
    let r = request(app.getHttpServer())
      .post('/api/waitlist')
      .send({
        fullName: 'Hardening Test',
        email,
        investorType: 'investor',
        consent: true,
      });
    if (ip) r = r.set('X-Forwarded-For', ip);
    return r;
  };

  it('treats case variants of one address as the same entry (idempotent, one mail)', async () => {
    const mixed = `Hardening-${stamp}-case@Example.local`;
    const lower = mixed.toLowerCase();

    const first = await signup(mixed).expect(201);
    const second = await signup(lower).expect(201);

    // Same row: the second submission returns the existing entry's id.
    expect(second.body.id).toBe(first.body.id);

    const rows = await prisma.waitlistEntry.findMany({
      where: { email: lower },
    });
    expect(rows).toHaveLength(1);
    // The stored address is the canonical lowercase form, whatever the caller
    // sent.
    expect(rows[0].email).toBe(lower);

    // Cleanup for the case row (not covered by the emails array).
    await prisma.waitlistEntry.deleteMany({ where: { email: lower } });
  });

  it('throttles POST /waitlist per visitor IP, not globally', async () => {
    // Five distinct addresses from one IP succeed…
    for (const email of emails) {
      await signup(email, '203.0.113.99').expect(201);
    }
    // …the sixth from the same IP is rejected…
    await signup(`hardening-${stamp}-f@example.local`, '203.0.113.99').expect(429);
    // …while a different IP is unaffected (its own bucket).
    await signup(`hardening-${stamp}-g@example.local`, '203.0.113.100').expect(201);
    await prisma.waitlistEntry.deleteMany({
      where: {
        email: {
          in: [`hardening-${stamp}-f@example.local`, `hardening-${stamp}-g@example.local`],
        },
      },
    });
  });

  it('throttles the public GET /waitlist/count at 60/min', async () => {
    const ip = '203.0.113.101';
    for (let i = 0; i < 60; i++) {
      await request(app.getHttpServer())
        .get('/api/waitlist/count')
        .set('X-Forwarded-For', ip)
        .expect(200);
    }
    await request(app.getHttpServer())
      .get('/api/waitlist/count')
      .set('X-Forwarded-For', ip)
      .expect(429);
  });
});
