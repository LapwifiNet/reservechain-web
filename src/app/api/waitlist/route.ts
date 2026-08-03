import { NextResponse } from 'next/server';
import { SlidingWindowLimiter } from '../../../lib/rate-limit';

export const runtime = 'nodejs';

// The website no longer owns a waitlist store. It forwards registrations to the
// shared API so the site and the admin console read and write the same data.
//
// WAITLIST_API_BASE is server-side only and must never be NEXT_PUBLIC_. No
// credential is sent: POST /api/waitlist is public by design, and the website
// holds no service token.
const API_BASE = process.env.WAITLIST_API_BASE || 'http://127.0.0.1:4000/api';

const INVESTOR_TYPES = ['institution', 'investor', 'partner', 'other'];

// A waitlist form is a few hundred bytes. Anything larger is not a human
// filling a form.
const MAX_BODY_BYTES = 16 * 1024;
// The API is on the same compose network; 8s is generous and still fails fast
// instead of hanging the visitor's request forever.
const UPSTREAM_TIMEOUT_MS = 8_000;

// Per-visitor 5/min, plus a 60/min ceiling across the whole site. The per-IP
// window stops casual spam; the global one bounds a client that rotates
// spoofed X-Forwarded-For values — the header is only as trustworthy as the
// proxy in front of this server, and docker-compose exposes web:3000
// directly. The API throttles per visitor too (its tracker reads the first
// X-Forwarded-For hop), so this route must forward the visitor's real
// address, never a client-supplied value.
const perVisitor = new SlidingWindowLimiter({ windowMs: 60_000, max: 5 });
const siteWide = new SlidingWindowLimiter({ windowMs: 60_000, max: 60 });

/**
 * The visitor's real address: the first X-Forwarded-For hop, or 'unknown'
 * when the deployment forwards none (then every such visitor shares one
 * bucket — still bounded by the site-wide window).
 */
function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const retryAfter = perVisitor.check(ip) || siteWide.check('site');
  if (retryAfter > 0) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(retryAfter) } },
    );
  }

  // Read the body once, cap its size, then parse. content-length can be
  // absent (chunked), so the parsed length is the enforcement point.
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 413 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  if (!body?.consent) {
    return NextResponse.json({ ok: false, error: 'consent_required' }, { status: 400 });
  }

  const investorType = INVESTOR_TYPES.includes(body?.investorType)
    ? body.investorType
    : 'other';

  const payload = {
    // The API requires a name; fall back to the address local-part so a blank
    // optional field cannot fail the submission.
    fullName: String(body?.name || '').trim() || email.split('@')[0],
    email,
    investorType,
    consent: true,
    organization: body?.organization ? String(body.organization) : undefined,
    interest: body?.interest ? String(body.interest) : undefined,
    locale: body?.locale ? String(body.locale) : 'en',
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/waitlist`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Overwrite, never forward: the API's per-visitor buckets key on this
        // header, so it must carry the visitor's real address.
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (e) {
    // Never log the error object: it can carry the request body, and waitlist
    // rows are PII. Status-only logging, same as below.
    const timedOut = e instanceof DOMException && e.name === 'TimeoutError';
    console.error(
      timedOut
        ? 'waitlist proxy: backend timed out'
        : 'waitlist proxy: backend unreachable',
    );
    return NextResponse.json(
      { ok: false, error: timedOut ? 'upstream_timeout' : 'server_error' },
      { status: timedOut ? 504 : 500 },
    );
  }

  if (res.status === 429) {
    // The API's own per-visitor limit fired (this route's windows are
    // separate, so both can trip in sequence). Pass the status through so the
    // form can show the rate-limit message.
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }
  if (res.status === 400) {
    // A validation the route's own checks missed (e.g. name > 200 chars).
    // Status only — the response body may echo submitted values.
    console.error('waitlist proxy: backend rejected the payload', res.status);
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }
  if (!res.ok) {
    // Status only. The response body may echo submitted values.
    console.error('waitlist proxy: backend rejected the submission', res.status);
    return NextResponse.json({ ok: false, error: 'bad_gateway' }, { status: 502 });
  }

  // Re-submitting a known address is not an error: the API is idempotent on
  // email and returns the existing id, so the caller sees the same success shape.
  const data = await res.json().catch(() => ({}) as any);
  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
