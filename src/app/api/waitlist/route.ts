import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// The website no longer owns a waitlist store. It forwards registrations to the
// shared API so the site and the admin console read and write the same data.
//
// WAITLIST_API_BASE is server-side only and must never be NEXT_PUBLIC_. No
// credential is sent: POST /api/waitlist is public by design, and the website
// holds no service token.
const API_BASE = process.env.WAITLIST_API_BASE || 'http://127.0.0.1:4000/api';

const INVESTOR_TYPES = ['institution', 'investor', 'partner', 'other'];

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const email = String(body?.email || '').trim();
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
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    // Never log the error object: it can carry the request body, and waitlist
    // rows are PII.
    console.error('waitlist proxy: backend unreachable');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  if (!res.ok) {
    // Status only. The response body may echo submitted values.
    console.error('waitlist proxy: backend rejected the submission', res.status);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  // Re-submitting a known address is not an error: the API is idempotent on
  // email and returns the existing id, so the caller sees the same success shape.
  const data = await res.json().catch(() => ({}) as any);
  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
