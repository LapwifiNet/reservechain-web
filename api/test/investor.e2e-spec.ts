import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bearer, createTestApp, TestContext } from './utils/test-app';

// From the p8tests overlay, adapted to the current token model: investor
// tokens carry typ='investor' (not the overlay's scope claim) and are signed
// with INVESTOR_JWT_SECRET, so cross-domain refusal is 401 at the signature,
// not a role comparison. KYC fixtures use the Prisma model's field names
// (legalName, subjectType person/entity), not the overlay's subjectName.
describe('Investor portal (e2e, mocked persistence)', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  const creds = {
    fullName: 'Ada Investor',
    email: 'ada@example.com',
    password: 'supersecret1',
  };

  it('registers a new investor and returns an investor-domain token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/investor/register')
      .send(creds)
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.investor).toMatchObject({
      email: 'ada@example.com',
      fullName: 'Ada Investor',
    });
    // The response must NOT expose the password hash anywhere.
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    // The token verifies in the investor domain and carries its typ…
    const payload = await ctx.investorJwt.verifyAsync(res.body.accessToken);
    expect(payload.typ).toBe('investor');
    // …and fails the admin domain's signature outright.
    await expect(ctx.adminJwt.verifyAsync(res.body.accessToken)).rejects.toThrow();
  });

  it('rejects a password shorter than 8 characters (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/investor/register')
      .send({ ...creds, email: 'short@example.com', password: 'short' })
      .expect(400);
  });

  it('rejects a duplicate email (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/investor/register')
      .send(creds)
      .expect(409);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app.getHttpServer())
      .post('/api/investor/login')
      .send({ email: creds.email, password: creds.password })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/investor/login')
      .send({ email: creds.email, password: 'wrong-password' })
      .expect(401);
  });

  it('requires a bearer token for /me and /status', async () => {
    await request(app.getHttpServer()).get('/api/investor/me').expect(401);
    await request(app.getHttpServer()).get('/api/investor/status').expect(401);
  });

  it('returns aggregated status matched by email', async () => {
    ctx.prisma._seed('waitlistEntry', [
      {
        id: 'w1',
        fullName: 'Ada Investor',
        email: 'ada@example.com',
        investorType: 'institution',
        organization: 'Ada Capital',
        interest: 'Copper',
        consent: true,
        locale: 'en',
      },
    ]);
    ctx.prisma._seed('kycCase', [
      {
        id: 'k1',
        legalName: 'Ada Investor',
        subjectType: 'person',
        email: 'ada@example.com',
        country: 'US',
        status: 'in_review',
        riskLevel: 'low',
        sanctions: 'clear_stub',
      },
    ]);
    ctx.prisma._seed('assetProgram', [
      {
        id: 'p1',
        code: 'CP',
        name: 'Copper Powder',
        metal: 'Copper',
        purity: '99.9999%',
        status: 'active',
      },
    ]);

    const token = await ctx.investorToken('ada@example.com');
    const res = await request(app.getHttpServer())
      .get('/api/investor/status')
      .set(bearer(token))
      .expect(200);

    expect(res.body.profile.email).toBe('ada@example.com');
    expect(res.body.waitlist).toMatchObject({
      investorType: 'institution',
      organization: 'Ada Capital',
    });
    expect(res.body.kyc.status).toBe('in_review');
    expect(res.body.kyc.sanctions).toBe('clear_stub');
    expect(res.body.programs).toHaveLength(1);
    expect(res.body.programs[0].code).toBe('CP');
  });

  it('defaults KYC to not_started when no case exists', async () => {
    const token = await ctx.investorToken('nobody@example.com');
    const res = await request(app.getHttpServer())
      .get('/api/investor/status')
      .set(bearer(token))
      .expect(200);

    expect(res.body.waitlist).toBeNull();
    expect(res.body.kyc.status).toBe('not_started');
  });

  it('refuses an admin token on investor routes (wrong domain, 401)', async () => {
    await request(app.getHttpServer())
      .get('/api/investor/status')
      .set(bearer(ctx.adminToken))
      .expect(401);
  });
});
