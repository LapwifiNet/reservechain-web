import { cookies } from "next/headers";

export const INVESTOR_COOKIE = "orwa_participant";

// Backend base URL. Reuses the same env the waitlist wiring uses.
export const API_BASE =
  process.env.WAITLIST_API_BASE ||
  process.env.API_BASE_URL ||
  "http://127.0.0.1:4000/api";

export function getInvestorToken(): string | null {
  return cookies().get(INVESTOR_COOKIE)?.value ?? null;
}

export type InvestorStatus = {
  profile: {
    id: string | null;
    email: string;
    fullName: string;
    memberSince: string | null;
  };
  waitlist: {
    investorType: string;
    organization: string | null;
    interest: string | null;
    joinedAt: string;
  } | null;
  kyc: { status: string; riskLevel: string; sanctions: string };
  programs: Array<{
    code: string;
    name: string;
    metal: string;
    purity: string;
    status: string;
  }>;
};

export async function fetchInvestorStatus(
  token: string,
): Promise<InvestorStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/investor/status`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as InvestorStatus;
  } catch {
    return null;
  }
}
