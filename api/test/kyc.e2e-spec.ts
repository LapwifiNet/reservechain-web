import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bearer, createTestApp, TestContext } from './utils/test-app';

// From the p8tests overlay, adapted to the current backend: fixtures use the
// Prisma model's field names (legalName; subjectType person/entity), and an
// investor token is refused with 401 — JwtAuthGuard rejects the wrong token
// domain at the signature/typ wall before RolesGuard could ever say 403.
describe('KYC/KYB compliance (e2e, mocked persistence)', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  const newCase = {
    legalName: 'Globex Ltd',
    subjectType: 'entity',
    email: 'kyc@globex.com',
    country: 'DE',
  };

  it('blocks unauthenticated access (401)', async () => {
    await request(app.getHttpServer()).get('/api/kyc/cases').expect(401);
    await request(app.getHttpServer()).get('/api/kyc/stats').expect(401);
  });

  it('refuses an investor-domain token (401 at the token wall)', async () => {
    const token = await ctx.investorToken();
    await request(app.getHttpServer())
      .get('/api/kyc/cases')
      .set(bearer(token))
      .expect(401);
  });

  let caseId: string;

  it('creates a case as admin (defaults to pending)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/kyc/cases')
      .set(bearer(ctx.adminToken))
      .send(newCase)
      .expect(201);

    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.status).toBe('pending');
    caseId = res.body.id;
  });

  it('validates the create DTO (400 on bad subjectType)', async () => {
    await request(app.getHttpServer())
      .post('/api/kyc/cases')
      .set(bearer(ctx.adminToken))
      .send({ ...newCase, subjectType: 'robot' })
      .expect(400);
  });

  it('lists cases for a compliance user, without the investor-email link', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/kyc/cases')
      .set(bearer(ctx.complianceToken))
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    // The case above was created WITH an email; the list projection must not
    // return it (PII the console table has no use for). The single-case
    // detail view keeps it — see the screen test below.
    for (const row of res.body) {
      expect(row).not.toHaveProperty('email');
      expect(row.legalName).toBeDefined();
    }
  });

  it('reviews a case and records the reviewer', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/kyc/cases/${caseId}/review`)
      .set(bearer(ctx.complianceToken))
      .send({ status: 'approved', riskLevel: 'low', notes: 'Docs verified' })
      .expect(201);

    expect(res.body.status).toBe('approved');
    expect(res.body.riskLevel).toBe('low');
    expect(res.body.reviewedBy).toBe('compliance@openrwa.local');

    // reviewedAt is set together with reviewedBy, never separately. It was
    // previously never written at all, so every reviewed case carried an
    // attributed reviewer and a blank timestamp — a decision you cannot place
    // in time against a sanctions list version or a document expiry.
    expect(res.body.reviewedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(String(res.body.reviewedAt)))).toBe(false);
  });

  it('runs the illustrative sanctions screening stub and persists the outcome', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/kyc/cases/${caseId}/screen`)
      .set(bearer(ctx.adminToken))
      .expect(201);

    expect(res.body).toMatchObject({ provider: 'stub', result: 'clear' });
    expect(res.body.note).toContain('Illustrative');

    const detail = await request(app.getHttpServer())
      .get(`/api/kyc/cases/${caseId}`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(detail.body.sanctions).toBe('clear_stub');
  });

  it('returns 404 for an unknown case', async () => {
    await request(app.getHttpServer())
      .get('/api/kyc/cases/does-not-exist')
      .set(bearer(ctx.adminToken))
      .expect(404);
  });

  it('aggregates stats by status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/kyc/stats')
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.byStatus)).toBe(true);
    const approved = res.body.byStatus.find(
      (b: { status: string; count: number }) => b.status === 'approved',
    );
    expect(approved?.count).toBeGreaterThanOrEqual(1);
  });
});
