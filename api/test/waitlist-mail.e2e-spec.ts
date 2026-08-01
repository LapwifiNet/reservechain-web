import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../src/mail/mail.service';

/**
 * MailService contract — the waitlist confirmation mail must be a logged
 * no-op when no webhook is configured (the pre-launch default), and must
 * never throw regardless of webhook behaviour.
 */
describe('MailService (waitlist confirmation)', () => {
  let service: MailService;

  const originalEnv = { ...process.env };

  beforeEach(async () => {
    // Start clean: no webhook configured.
    delete process.env.MAIL_WEBHOOK_URL;
    delete process.env.MAIL_WEBHOOK_TOKEN;
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();
    service = module.get(MailService);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('is disabled when MAIL_WEBHOOK_URL is unset', () => {
    expect(service.enabled).toBe(false);
  });

  it('is enabled when MAIL_WEBHOOK_URL is set', () => {
    process.env.MAIL_WEBHOOK_URL = 'https://hooks.example.com/send';
    expect(service.enabled).toBe(true);
  });

  it('no-ops without throwing when unconfigured', async () => {
    await expect(
      service.sendWaitlistConfirmation({
        email: 'test@example.com',
        name: 'Test User',
        entryId: 'entry-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when the webhook is unreachable', async () => {
    process.env.MAIL_WEBHOOK_URL = 'http://127.0.0.1:1/unreachable';
    process.env.MAIL_WEBHOOK_TOKEN = 'secret';
    await expect(
      service.sendWaitlistConfirmation({
        email: 'test@example.com',
        name: 'Test User',
        entryId: 'entry-1',
      }),
    ).resolves.toBeUndefined();
  });
});
