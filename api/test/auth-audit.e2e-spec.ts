import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import * as bcryptjs from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Staff sign-ins are audited on BOTH outcomes, and neither outcome may leak a
// credential or reveal whether an account exists.
//
// The failure half is the point: a run of rejected sign-ins is the signal an
// attribution trail most needs, and recording only successes makes a
// credential-stuffing run invisible. But an audit row on an unauthenticated
// route is itself a disclosure surface, so a rejected attempt is written with
// the actor stripped — otherwise the trail becomes an oracle for which
// addresses exist, readable by anyone who later gains audit access.
describe('Staff sign-ins are audited, without leaking credentials or existence', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const EMAIL = 'spec-authaudit@example.local';
  const PASSWORD = 'spec-only-not-a-real-secret-42';
  const WRONG_PASSWORD = 'spec-only-wrong-secret-42';
  const ABSENT_EMAIL = 'spec-authaudit-nobody@example.local';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.adminUser.upsert({
      where: { email: EMAIL },
      update: { passwordHash: await bcryptjs.hash(PASSWORD, 10) },
      create: {
        email: EMAIL,
        passwordHash: await bcryptjs.hash(PASSWORD, 10),
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany({ where: { email: EMAIL } });
    await prisma.$disconnect();
    await app.close();
  });

  const latestAuthEvents = (take = 25) =>
    prisma.auditEvent.findMany({
      where: { action: 'create.auth' },
      orderBy: { sequence: 'desc' },
      take,
    });

  it('records a successful sign-in, attributed to the officer', async () => {
    await supertest(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(201);

    const events = await latestAuthEvents();
    const success = events.find(
      (e) => (e.metadata as Record<string, any>)?.outcome === 'success',
    );
    expect(success).toBeDefined();
    // Attribution is the whole point: a compliance trail that cannot say who
    // signed in cannot attribute the decisions they then make.
    expect(success!.actorEmail).toBe(EMAIL);

    const body = (success!.metadata as Record<string, any>).body;
    expect(body.password).toBe('[REDACTED]');
    expect(body.email).toBe('[PII_REDACTED]');
  });

  it('records a rejected sign-in with no actor and no credential', async () => {
    await supertest(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: EMAIL, password: WRONG_PASSWORD })
      .expect(401);

    const events = await latestAuthEvents();
    const failure = events.find(
      (e) => (e.metadata as Record<string, any>)?.outcome === 'failure',
    );
    expect(failure).toBeDefined();
    expect(failure!.actorEmail).toBe('[PII_REDACTED]');
    expect(failure!.actorId).toBeNull();
    expect((failure!.metadata as Record<string, any>).body.password).toBe(
      '[REDACTED]',
    );
  });

  it('is not an existence oracle: a real and an unknown address record alike', async () => {
    await supertest(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: ABSENT_EMAIL, password: WRONG_PASSWORD })
      .expect(401);

    const events = await latestAuthEvents();
    const failures = events.filter(
      (e) => (e.metadata as Record<string, any>)?.outcome === 'failure',
    );
    expect(failures.length).toBeGreaterThanOrEqual(2);

    // Every failure row must be indistinguishable on the fields that could
    // disclose whether the attempted account exists.
    for (const f of failures) {
      expect(f.actorEmail).toBe('[PII_REDACTED]');
      expect(f.actorRole).toBe('staff');
      expect((f.metadata as Record<string, any>).reason).toBe('rejected');
    }

    // And neither attempted address appears anywhere in the audit table.
    const all = JSON.stringify(await latestAuthEvents(100));
    expect(all).not.toContain(ABSENT_EMAIL);
  });

  it('never writes either password into the audit table, anywhere', async () => {
    const rows = await prisma.auditEvent.findMany({ take: 500 });
    const serialised = JSON.stringify(rows);
    expect(serialised).not.toContain(PASSWORD);
    expect(serialised).not.toContain(WRONG_PASSWORD);
  });

  it('records a public waitlist signup with the registrant redacted in the body', async () => {
    const email = `spec-authaudit-wl-${Date.now()}@example.local`;
    await supertest(app.getHttpServer())
      .post('/api/waitlist')
      .send({
        fullName: 'Illustrative Waitlist Subject',
        email,
        investorType: 'investor',
        consent: true,
      })
      .expect(201);

    const events = await prisma.auditEvent.findMany({
      where: { action: 'create.waitlist' },
      orderBy: { sequence: 'desc' },
      take: 10,
    });
    const event = events.find((e) => e.actorEmail === email);
    expect(event).toBeDefined();
    expect(event!.actorRole).toBe('public');

    const body = (event!.metadata as Record<string, any>).body;
    expect(body.email).toBe('[PII_REDACTED]');
    expect(body.fullName).toBe('[PII_REDACTED]');

    await prisma.waitlistEntry.deleteMany({ where: { email } });
  });
});
