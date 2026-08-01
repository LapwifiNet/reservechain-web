import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Enquiry forms proxy to the shared API so web + admin read one store.
// WAITLIST_API_BASE is reused deliberately: the API is a single deployment.
const API_BASE = process.env.WAITLIST_API_BASE || 'http://127.0.0.1:4000/api';
const KINDS = ['enterprise', 'asset-owner', 'industrial-buyer', 'contact'];

export async function POST(
  req: Request,
  { params }: { params: { kind: string } },
) {
  const kind = params.kind;
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: 'invalid_kind' }, { status: 400 });
  }

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
  const message = String(body?.message || '').trim();
  if (message.length < 10) {
    return NextResponse.json({ ok: false, error: 'message_too_short' }, { status: 400 });
  }

  const payload = {
    kind,
    fullName: String(body?.name || '').trim() || email.split('@')[0],
    email,
    company: String(body?.company || '').trim() || undefined,
    message,
    locale: String(body?.locale || 'en').slice(0, 10),
  };

  try {
    const res = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error =
        res.status === 429
          ? 'rate_limited'
          : (data as { error?: string }).error || 'upstream_error';
      return NextResponse.json({ ok: false, error }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, error: 'upstream_unreachable' }, { status: 502 });
  }
}
