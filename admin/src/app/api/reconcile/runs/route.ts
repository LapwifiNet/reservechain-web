import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/reconcile/runs");
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
