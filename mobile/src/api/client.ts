import type {
  AssetProgram,
  AuthResponse,
  InvestorStatus,
  Passport,
  PayloadList,
  WaitlistPayload,
} from "./types";

// EXPO_PUBLIC_* is INLINED INTO THE SHIPPED BUNDLE at build time and is
// readable by anyone who downloads the app. Only genuinely public values belong
// here: these two are base URLs for endpoints that serve unauthenticated
// callers anyway. Never put a token, key or secret in an EXPO_PUBLIC_ variable.
//
// No default host. The overlay fell back to a real domain
// (https://api.reservechain.io), which is not a domain this project controls or
// has deployed, and committing it would have shipped a live-looking endpoint in
// an app-store binary. An unset base fails loudly at the first request instead.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";
const CMS_BASE = process.env.EXPO_PUBLIC_CMS_BASE ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  base?: string;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const base = opts.base ?? API_BASE;
  if (!base) {
    throw new ApiError(
      0,
      "not_configured",
      "No API base configured. Set EXPO_PUBLIC_API_BASE and EXPO_PUBLIC_CMS_BASE (see .env.example).",
    );
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "network_error", "Network request failed");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const code = data?.error ?? data?.code ?? "request_failed";
    const message = data?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, code, message);
  }
  return data as T;
}

export const api = {
  // Public content from the CMS.
  //
  // The overlay called /asset-programs/public and /asset-programs/public/:slug.
  // Neither exists: the CMS defines exactly one custom endpoint,
  // /passports/public/:slug, and its own README admitted the programs endpoint
  // was "the one addition needed on the backend". Rather than add a backend
  // route for a client, these use Payload's standard collection REST, which is
  // already there — anonymous callers see published documents only, enforced by
  // the collection's access control, so no sanitisation is being skipped.
  listPrograms: async () => {
    const res = await request<PayloadList<AssetProgram>>(
      "/asset-programs?where[status][equals]=published&limit=100&sort=code",
      { base: CMS_BASE },
    );
    return res.docs ?? [];
  },
  getProgram: async (slug: string) => {
    const res = await request<PayloadList<AssetProgram>>(
      `/asset-programs?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&limit=1`,
      { base: CMS_BASE },
    );
    return res.docs?.[0] ?? null;
  },
  getPassport: (slug: string) =>
    request<Passport>(`/passports/public/${encodeURIComponent(slug)}`, {
      base: CMS_BASE,
    }),

  // Waitlist (backend API)
  joinWaitlist: (payload: WaitlistPayload) =>
    request<{ ok: true }>("/waitlist", { method: "POST", body: payload }),

  // Investor auth (backend API)
  register: (body: { email: string; password: string; fullName: string }) =>
    request<AuthResponse>("/investor/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/investor/login", { method: "POST", body }),
  status: (token: string) =>
    request<InvestorStatus>("/investor/status", { token }),
};
