import type {
  AssetProgram,
  AssetRecord,
  DashboardStats,
  Passport,
  Tokenomics,
  WaitlistEntry,
} from "./types";

const BASE = process.env.API_BASE_URL || "http://127.0.0.1:4000/api";
const API_TOKEN = process.env.API_TOKEN;

export type ApiResult<T> = { data: T | null; error: string | null };

async function get<T>(path: string): Promise<ApiResult<T>> {
  try {
    const headers: HeadersInit = { accept: "application/json" };
    if (API_TOKEN) {
      headers["authorization"] = `Bearer ${API_TOKEN}`;
    }
    const res = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) {
      if (res.status === 401) {
        return { data: null, error: "Unauthorized — set API_TOKEN" };
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
  tokenomics: () => get<Tokenomics>("/tokenomics"),
};
