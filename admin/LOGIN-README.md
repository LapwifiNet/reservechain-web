# Admin Console — Login (per-user sessions)

Replaces the static service-token flow with a real **login screen**. A session is
a JWT issued by `POST /api/auth/login` on the backend, stored in an **httpOnly
cookie**; middleware gates every page route; the topbar shows the signed-in user
and role with a **Sign out** button.

> Requires P6 on the backend (JWT auth + RBAC).

## Files

### Session and auth
- `src/lib/session-constants.ts` — cookie name, import-free so edge middleware can use it.
- `src/lib/session.ts` — `getToken()`: session cookie first, then optional `API_TOKEN`. **Reads only.**
- `src/lib/backend.ts` — `backendFetch()`: session cookie **only**, for writes.
- `src/lib/auth.ts` — `getSessionUser()`, decodes the JWT payload for display only.
- `src/middleware.ts` — redirects to `/login` when the session cookie is absent.

### Routes and UI
- `src/app/api/auth/login/route.ts` — proxies login, sets the httpOnly cookie.
- `src/app/api/auth/logout/route.ts` — clears the cookie.
- `src/app/login/page.tsx`, `src/components/LoginForm.tsx`, `src/components/LogoutButton.tsx`.
- `src/components/ConditionalShell.tsx` — hides sidebar/topbar on `/login`.
- `src/app/layout.tsx`, `src/components/Topbar.tsx` — updated for the above.

### Backend proxies
Route handlers keep the JWT server-side so it never reaches the browser:
- `src/app/api/kyc/cases/route.ts`, `.../[id]/review/route.ts`, `.../[id]/screen/route.ts`
- `src/app/api/audit/route.ts`, `src/app/api/audit/verify/route.ts`

`src/lib/api.ts` sends the token from `getToken()` and retains the full method
list (`dashboardStats`, `programs`, `registry`, `passports`, `waitlist`,
`tokenomics`, `audit`, `auditVerify`, `kycStats`, `kycCases`, `kycCase`).

## How it works

1. Unauthenticated page request → middleware redirects to `/login?from=…`.
2. Login form → `POST /api/auth/login` (route handler) → backend
   `POST /api/auth/login` → sets the `rc_session` httpOnly cookie (12h).
3. Server components read the backend with `Authorization: Bearer <cookie JWT>`.
4. Backend RBAC enforces admin/compliance on protected endpoints.
5. Sign out → `POST /api/auth/logout` clears the cookie.

The cookie is `httpOnly` and `sameSite=lax`, and is set `Secure` automatically
when `NODE_ENV=production`.

## Service token: reads only, never writes

The static `SERVICE_API_TOKEN` / `API_TOKEN` path remains available as a fallback
for **reads** only, to support headless and server-to-server use.

**Every KYC write from this console is session-cookie-only.** `backendFetch()`
reads the session cookie and nothing else, and returns `401` when there is no
session; there is no service-token fallback on any write path. This is an
enforced rule, not a preference: a review must be attributable to a named
compliance officer, and the backend records `req.user.email` as the reviewer, so
a shared service principal would make every review identical in the audit log.

Scope of that enforcement: it lives in this console, in `backendFetch()`. The
backend's `JwtAuthGuard` still accepts `SERVICE_API_TOKEN` as an ADMIN service
principal on **all** routes, so a caller holding that token can bypass the
console and write directly to the API, recording `reviewedBy` as
`service@reservechain`. Closing that gap requires rejecting the service
principal on KYC write routes in the API itself; until then, treat
`SERVICE_API_TOKEN` as a credential that must not be distributed to anyone who
should not be able to forge a review.

## Local use

The overlay is already applied; no copy step is needed. To run:

```bash
cd admin
npm install
npx tsc --noEmit
npm run build
npm run dev        # http://localhost:4100 → redirects to /login
```

Environment (`admin/.env`, see `.env.example`):
- `API_BASE_URL` — backend base URL, e.g. `http://127.0.0.1:4000/api`.
- `API_TOKEN` — optional, reads only. Leave unset for normal console use.

Sign in with a seeded user. The seed creates `admin@reservechain.local`,
`compliance@reservechain.local` and `viewer@reservechain.local`; it takes their
passwords from `SEED_ADMIN_PASSWORD`, `SEED_COMPLIANCE_PASSWORD` and
`SEED_VIEWER_PASSWORD`, and generates a random one (printed once by the seed
script) for any that are unset. There are no default passwords, and the seed
refuses to create admin users when `NODE_ENV=production`.
