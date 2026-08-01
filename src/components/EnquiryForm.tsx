'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export type EnquiryKind = 'enterprise' | 'asset-owner' | 'industrial-buyer' | 'contact';

const KIND_ROUTE: Record<EnquiryKind, string> = {
  enterprise: '/api/enquiries/enterprise',
  'asset-owner': '/api/enquiries/asset-owner',
  'industrial-buyer': '/api/enquiries/industrial-buyer',
  contact: '/api/enquiries/contact',
};

const MIN_WAIT_MS = 3500; // honeypot: real humans take >3.5s to fill a form

/**
 * EnquiryForm slot (SC-WEB-ENT / SC-WEB-ASSETOWNER / SC-WEB-BUYER /
 * SC-WEB-CONTACT). Collects name/email/message only — never payment, wallet
 * or token-reservation fields (FR-WL prohibitions apply to enquiries too).
 *
 * Includes a hidden honeypot field and a minimum-submit-time check; both are
 * cheap anti-spam that needs no captcha provider (Screen Registry step 2 —
 * "siết waitlist": email verification + captcha are tracked separately).
 *
 * The form posts to the shared API so admin can read enquiries in one place.
 */
export function EnquiryForm({
  kind,
  title,
  submitLabel = 'Send enquiry',
}: {
  kind: EnquiryKind;
  title: string;
  submitLabel?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [honey, setHoney] = useState('');
  const [t0] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (honey) return; // bot filled the hidden field — silently drop
    if (Date.now() - t0 < MIN_WAIT_MS) {
      setError('Please take a moment to complete the form.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(KIND_ROUTE[kind], {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, company, message }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error === 'rate_limited'
            ? 'Too many submissions — please try again later.'
            : 'Could not send the enquiry. Check the fields and try again.',
        );
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-success/40 bg-success/10 p-6 text-sm text-text">
        Thank you — your enquiry has been received. We will respond as the
        project develops; no commitment is implied by submitting.
      </div>
    );
  }

  const inputCls =
    'w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-brand';

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <h2 className="serif text-lg">{title}</h2>
      {/* Honeypot — visually hidden, bots fill it, humans never see it. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Company website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-text2">Name *</span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text2">Email *</span>
          <input
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-text2">Organisation (optional)</span>
        <input
          maxLength={200}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-text2">Message *</span>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputCls}
        />
      </label>
      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Sending…' : submitLabel}
      </button>
      <p className="text-[11px] leading-relaxed text-text2">
        Submitting an enquiry does not constitute an investment, token purchase,
        asset reservation or any entitlement to participate in a future offering.
      </p>
    </form>
  );
}
