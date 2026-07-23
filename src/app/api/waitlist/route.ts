import { NextResponse } from 'next/server';
import { addEntry } from '@/lib/store';

export const runtime = 'nodejs';

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

  try {
    const entry = await addEntry({
      email,
      name: body?.name ? String(body.name) : undefined,
      organization: body?.organization ? String(body.organization) : undefined,
      interest: body?.interest ? String(body.interest) : undefined,
      locale: body?.locale ? String(body.locale) : 'en',
    });
    return NextResponse.json({ ok: true, id: entry.id });
  } catch (error) {
    console.error('waitlist addEntry failed', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
