import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await backendFetch(`/reconcile/exceptions/${params.id}/resolve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
