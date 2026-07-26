import { NextRequest, NextResponse } from "next/server";
import { API_BASE, INVESTOR_COOKIE } from "@/lib/investor";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.fullName) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/investor/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: body.fullName,
        email: body.email,
        password: body.password,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "backend_unreachable" }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.accessToken) {
    const code =
      res.status === 409 ? "email_already_registered" : data?.message ?? "register_failed";
    return NextResponse.json({ error: code }, { status: res.status || 400 });
  }

  const out = NextResponse.json({ ok: true, investor: data.investor });
  out.cookies.set(INVESTOR_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return out;
}
