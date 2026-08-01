import { getToken } from "./session";
import type {
  AssetProgram,
  AssetRecord,
  DashboardStats,
  Passport,
  Tokenomics,
  WaitlistEntry,
  Enquiry,
  ReconcileRun,
  ReconcileException,
  AuditListResponse,
  ChainVerificationResult,
  KycCase,
  KycStats,
} from "./types";

const BASE = process.env.API_BASE_URL || "http://127.0.0.1:4000/api";

export type ApiResult<T> = { data: T | null; error: string | null };

// Reads run as the signed-in user (session cookie JWT). getToken() still falls
// back to API_TOKEN for headless/server-to-server reads; writes never do — see
// backendFetch in ./backend.
async function get<T>(path: string): Promise<ApiResult<T>> {
  const token = getToken();
  try {
    const res = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          data: null,
          error: `Unauthorized (HTTP ${res.status}) — sign in again`,
        };
      }
      return { data: null, error: `HTTP ${res.status} ${res.statusText}` };
    }
    return { data: (await res.json()) as T, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network_error";
    return { data: null, error: msg };
  }
}


async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const token = getToken();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          data: null,
          error: `Unauthorized (HTTP ${res.status}) — sign in again`,
        };
      }
      return { data: null, error: `HTTP ${res.status} ${res.statusText}` };
    }
    return { data: (await res.json()) as T, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network_error";
    return { data: null, error: msg };
  }
}

export const api = {
  base: BASE,
  dashboardStats: () => get<DashboardStats>("/dashboard/stats"),
  programs: () => get<AssetProgram[]>("/assets/programs"),
  registry: () => get<AssetRecord[]>("/assets/registry"),
  passports: () => get<Passport[]>("/passports"),
  waitlist: () => get<WaitlistEntry[]>("/waitlist"),
  enquiries: () => get<Enquiry[]>("/enquiries"),
  reconcileRuns: () => get<ReconcileRun[]>("/reconcile/runs"),
  reconcileExceptions: () => get<ReconcileException[]>("/reconcile/exceptions"),
  reconcileRun: (type: string) =>
    post<ReconcileRun>("/reconcile/run", { type }),
  resolveException: (id: string) =>
    post<ReconcileException>(`/reconcile/exceptions/${id}/resolve`, {}),
  tokenomics: () => get<Tokenomics>("/tokenomics"),
  audit: (params: {
    skip?: number;
    take?: number;
    actorId?: string;
    action?: string;
    resourceType?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.skip !== undefined) searchParams.append("skip", params.skip.toString());
    if (params.take !== undefined) searchParams.append("take", params.take.toString());
    if (params.actorId) searchParams.append("actorId", params.actorId);
    if (params.action) searchParams.append("action", params.action);
    if (params.resourceType) searchParams.append("resourceType", params.resourceType);
    if (params.fromDate) searchParams.append("fromDate", params.fromDate);
    if (params.toDate) searchParams.append("toDate", params.toDate);
    return get<AuditListResponse>(`/audit?${searchParams.toString()}`);
  },
  auditVerify: () => get<ChainVerificationResult>("/audit/verify"),
  // KYC reads only. The write routes (POST /kyc/cases, /cases/:id/review,
  // /cases/:id/screen) are intentionally not exposed here — see the note in
  // src/app/kyc/page.tsx.
  kycStats: () => get<KycStats>("/kyc/stats"),
  kycCases: (take?: number) =>
    get<KycCase[]>(
      take === undefined ? "/kyc/cases" : `/kyc/cases?take=${take}`,
    ),
  kycCase: (id: string) => get<KycCase>(`/kyc/cases/${encodeURIComponent(id)}`),
};
