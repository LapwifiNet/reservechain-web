import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bearer, createTestApp, TestContext } from './utils/test-app';

// Salvaged from the p8tests overlay's audit spec. The overlay's file name
// collided with the DB-backed audit.e2e-spec.ts already on main, which is
// kept; this file carries only the overlay tests that main did not already
// cover, corrected to the current design:
// - an investor token on /api/audit is 401 (token-domain wall), not 403;
// - the overlay's "metadata only / anonymous actor" test is dropped: main
//   deliberately audits only role-guarded mutations (public investor routes
//   are never recorded — pinned in investor-isolation.e2e-spec.ts) and it
//   stores a PII-redacted body in metadata by design;
// - no settle() sleep: since the concatMap fix the audit row is committed
//   before the response returns, and a timing-tuned test is banned anyway.
describe('Audit interceptor over HTTP (e2e, mocked persistence)', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses an investor-domain token on /api/audit (401 at the token wall)', async () => {
    const token = await ctx.investorToken();
    await request(app.getHttpServer())
      .get('/api/audit')
      .set(bearer(token))
      .expect(401);
  });

  it('attributes actor and role for an audited mutation, deterministically', async () => {
    await request(app.getHttpServer())
      .post('/api/kyc/cases')
      .set(bearer(ctx.adminToken))
      .send({
        legalName: 'Audited Co',
        subjectType: 'entity',
        email: 'audited@example.com',
        country: 'FR',
      })
      .expect(201);

    // No settling: the write is part of the response stream.
    const res = await request(app.getHttpServer())
      .get('/api/audit')
      .set(bearer(ctx.adminToken))
      .expect(200);

    const entry = res.body.events.find(
      (e: { action: string }) => e.action === 'create.kyc',
    );
    expect(entry).toBeDefined();
    expect(entry.actorEmail).toBe('admin@reservechain.local');
    expect(entry.actorRole).toBe('ADMIN');
  });

  it('does not audit reads of the trail itself', async () => {
    await request(app.getHttpServer())
      .get('/api/audit')
      .set(bearer(ctx.adminToken))
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/audit')
      .set(bearer(ctx.adminToken))
      .expect(200);

    const auditReads = res.body.events.filter(
      (e: { action: string }) => e.action.endsWith('.audit'),
    );
    expect(auditReads).toHaveLength(0);
  });
});
