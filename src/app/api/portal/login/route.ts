import { NextRequest, NextResponse } from "next/server";
import { API_BASE, INVESTOR_COOKIE } from "@/lib/investor";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/investor/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "backend_unreachable" }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.accessToken) {
    return NextResponse.json(
      { error: data?.message ?? "login_failed" },
      { status: res.status || 401 },
    );
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
