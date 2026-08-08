import { Injectable, Logger } from '@nestjs/common';

/**
 * Mail delivery abstraction — waitlist confirmation email (FR-WL).
 *
 * The website has no mail provider yet (build-plan blocker: "email needs a
 * mail provider"). Instead of adding a vendor SDK dependency, this service
 * posts a generic JSON payload to a configurable webhook endpoint when one is
 * configured. Any provider that accepts an HTTP hook (Resend, SendGrid,
 * Postmark, an SMTP relay with a webhook, a serverless function…) can be wired
 * in without code changes:
 *
 *   MAIL_WEBHOOK_URL=https://hooks.example.com/send
 *   MAIL_WEBHOOK_TOKEN=<secret shared with the hook>
 *
 * Both unset (the default) → delivery is a logged no-op and the request still
 * succeeds: the waitlist must never fail because mail is not configured yet.
 * The payload carries no PII beyond the subscriber's own address and name,
 * and only for the entry that was just created.
 *
 * Decision: fire-and-forget from the caller's perspective — this service
 * swallows its own errors (network, 4xx/5xx) and logs them, so a mail outage
 * can never take down the waitlist registration path.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /** Whether a webhook endpoint is configured. */
  get enabled(): boolean {
    return Boolean(process.env.MAIL_WEBHOOK_URL?.trim());
  }

  /**
   * Send the waitlist confirmation email for one newly created entry.
   * No-op when MAIL_WEBHOOK_URL is unset; never throws.
   */
  async sendWaitlistConfirmation(input: {
    email: string;
    name: string;
    entryId: string;
  }): Promise<void> {
    const url = process.env.MAIL_WEBHOOK_URL?.trim();
    if (!url) {
      this.logger.log(
        `waitlist confirmation skipped for ${input.email} (MAIL_WEBHOOK_URL unset)`,
      );
      return;
    }

    const token = process.env.MAIL_WEBHOOK_TOKEN?.trim();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          template: 'waitlist-confirmation',
          to: input.email,
          name: input.name,
          entryId: input.entryId,
          // Neutral, pre-launch-safe copy: no allocation, no investment,
          // no price, no reservation — mirrors CR-3 so the mail cannot
          // accidentally read as an offer.
          subject: 'OpenRWA — registration received',
          prelude:
            'Thank you for registering your interest in OpenRWA. This confirms your registration; it does not constitute an investment, a token purchase, an asset reservation, a price reservation, an allocation of tokens or any entitlement to participate in a future offering.',
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.warn(
          `waitlist confirmation webhook returned ${res.status} for ${input.email}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `waitlist confirmation delivery failed for ${input.email}: ${
          (err as Error).message
        }`,
      );
    }
  }
}
