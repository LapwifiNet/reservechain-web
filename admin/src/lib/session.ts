import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-constants";

// Server-only. Returns the bearer token to use for backend calls:
// the logged-in user's JWT (cookie) first, then an optional service token.
export function getToken(): string | null {
  const cookieToken = cookies().get(SESSION_COOKIE)?.value;
  return cookieToken || process.env.API_TOKEN || null;
}
