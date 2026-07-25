import { NextResponse } from "next/server";
import { api } from "@/lib/api";

// Server-side proxy for the hash-chain verification read; see ../route.ts.
export async function GET() {
  return NextResponse.json(await api.auditVerify());
}
