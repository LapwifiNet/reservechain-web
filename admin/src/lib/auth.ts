import { getToken } from "./session";

export type SessionUser = {
  email: string;
  role: string;
  sub?: string;
  exp?: number;
};

// Decodes the JWT payload for display only (no signature verification — the
// backend is the real authority). Returns null for non-JWT tokens (e.g. a raw
// service token) or when no session is present.
export function getSessionUser(): SessionUser | null {
  const token = getToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload?.email) return null;
    return {
      email: payload.email,
      role: payload.role,
      sub: payload.sub,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
