import { NextResponse } from "next/server";
import { INVESTOR_COOKIE } from "@/lib/investor";

export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set(INVESTOR_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return out;
}
