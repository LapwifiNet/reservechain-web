import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-constants";

const BASE = process.env.API_BASE_URL || "http://127.0.0.1:4000/api";

// Session cookie only. Unlike getToken() in ./session, this deliberately does
// NOT fall back to API_TOKEN / SERVICE_API_TOKEN: a KYC write must be
// attributable to a named compliance officer, and the backend records
// req.user.email as the reviewer. A shared service principal would make every
// review look identical in the audit log.
function getSessionToken(): string | null {
  return cookies().get(SESSION_COOKIE)?.value || null;
}

// Server-only helper for mutations: attaches the signed-in user's JWT so the
// browser never sees the token. Returns a 401 Response when there is no
// session, so callers can pass the status straight through.
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getSessionToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}
