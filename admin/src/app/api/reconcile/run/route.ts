import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.type) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const res = await backendFetch("/reconcile/run", {
    method: "POST",
    body: JSON.stringify({ type: body.type }),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
