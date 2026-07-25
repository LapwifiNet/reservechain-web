import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

// Server-side proxy so the audit page (a client component) never handles the
// session JWT itself — the token stays in the httpOnly cookie. Returns the same
// { data, error } shape as the api helper.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const num = (k: string) => {
    const v = sp.get(k);
    return v === null || v === "" ? undefined : Number(v);
  };
  const str = (k: string) => sp.get(k) || undefined;

  const result = await api.audit({
    skip: num("skip"),
    take: num("take"),
    actorId: str("actorId"),
    action: str("action"),
    resourceType: str("resourceType"),
    fromDate: str("fromDate"),
    toDate: str("toDate"),
  });

  return NextResponse.json(result);
}
