# OpenRWA — Admin Manual

Audience: staff with **Admin** or **Compliance** roles. Covers the Admin
Console, the CMS, and the inactive sensitive modules.

> **Status.** Nothing described here is deployed. There is no hosted admin
> console and no hosted CMS; both run locally. Procedures below are written from
> the code, not from operating a live system.

> **Testnet only.** Mainnet requires written authorization (P20).
>
> The four sensitive modules cannot be "enabled" by configuration — see §4.

---

## 1. Accounts, roles & sign-in

### 1.1 Roles
| Role | Can do |
| --- | --- |
| **ADMIN** | Everything: KYC decisions, tokenomics, publishing, settlement actions, user/config management |
| **COMPLIANCE** | KYC/KYB review, screening (stub), read audit log. Reserve attestations are refused — see §4 |
| **VIEWER** | Read-only access to permitted areas |

### 1.2 Sign in
- Open the Admin Console and log in with your work email + password.
- Accounts come from the database seed, which is **local-only**: it refuses to
  create staff users when `NODE_ENV=production`, ships no password, and
  generates a random one printed once unless `SEED_ADMIN_PASSWORD` /
  `SEED_COMPLIANCE_PASSWORD` / `SEED_VIEWER_PASSWORD` are supplied. There are no
  default credentials to change, because none are committed.
- Sessions last ~12 hours. A service token (`SERVICE_API_TOKEN`) is used only
  for server-to-server calls, never for humans — and it is **read-only**: any
  `POST`/`PATCH`/`PUT`/`DELETE` made with it is refused
  `403 service_principal_write_denied`, so a KYC decision is always attributable
  to a named officer rather than to a shared principal.
- Both successful and rejected sign-ins are recorded in the audit log. A
  rejected attempt is recorded with the attempted address redacted, so the log
  cannot be used to discover which accounts exist.
- If you get **403 insufficient_role**, your account lacks the required role — ask an Admin.

---

## 2. Admin Console

### 2.1 Dashboard
High-level counts (waitlist, KYC cases by status) and quick links.

### 2.2 Waitlist entries
- View registrations captured from the website (name, email, profile, consent,
  timestamp).
- **There is no export or segmentation feature.** The page lists entries; that
  is all it does. Treat everything on it as personal information.

### 2.3 KYC / KYB
- **Cases list** — filter by status: `pending`, `in_review`, `approved`, `rejected`.
- **Open a case** to see subject details, type (`person` / `entity` — not
  `individual`; the API rejects any other value), country, and risk level.
- **Create a case** manually when needed.
- **Screen** — an **illustrative stub**. It performs no external check against
  any sanctions, PEP or adverse-media provider, contacts nothing, and simply
  records the literal `clear_stub`. It must never be presented, exported or
  described as a completed screening; any surface that displays it carries the
  stub wording.
- **Review** — set the decision (`approve` / `reject`), risk level and notes.
  Decisions are attributed to you by email **and timestamped**: `reviewedBy` and
  `reviewedAt` are written together, never separately.
- KYC approval is the gate for investor actions elsewhere — approve only with adequate evidence.

### 2.4 Tokenomics configuration
- **Read-only.** The console displays the illustrative token parameters
  (symbol, cap, backing ratio, allocations); there is no editing surface. Values
  come from `TokenomicsConfig` in the database. They are demonstration values and
  must not be presented as final.

### 2.5 Audit log
- Recorded for each event: actor email, actor role, action, resource, request
  URL and method, a **redacted** copy of the request body, IP, user agent, and a
  timestamp. There is no status-code column.
- Scope: mutating requests (`POST`/`PATCH`/`PUT`/`DELETE`) that are either
  role-guarded or explicitly attributed to another actor domain — investor
  routes, staff sign-ins, and public waitlist signups. Reads are never audited.
- Passwords, tokens and personal fields are redacted before storage: a password
  is stored as `[REDACTED]`, and email, name and organisation as
  `[PII_REDACTED]`.
- The log is append-only and hash-chained; `/audit/verify` checks the chain.
  There are no update or delete routes, so entries cannot be altered through the
  application at all.

---

## 3. CMS (Payload) — content & registry

Runs as its own service with its own database. Sign in at the CMS admin URL.

### 3.1 Collections
- **Users** — CMS editors.
- **Media** — images/files, written to the CMS container's local `uploads/`
  directory. **Not S3.** The Terraform stack defines an S3 media bucket, but the
  CMS is not wired to it and that stack has never been applied.
- **Asset Programs** — Copper Powder, Nickel Wire (name, metal, purity, description, slug).
- **Asset Records** — individual lots with certificate-of-analysis references.
- **Passports** — the public provenance pages; a passport exposes token mapping **only after the lot is activated**.

### 3.2 Editing workflow
1. Create/update the Asset Program.
2. Add Asset Records (lots) with COA references.
3. Create a Passport, link it to a record; the public URL is derived from the slug.
4. Publishing changes updates the public website's passport pages (served via the sanitized public endpoint).

### 3.3 Cautions
- Keep every figure labeled **illustrative** and keep the prelaunch disclosure intact.
- Never expose internal-only fields; the public passport endpoint is intentionally sanitized.

---

## 4. Sensitive modules (inactive by default)

All four refuse every request with **`501`** — not `503`. More importantly,
**the feature flags do not enable them**. Each module refuses twice:

- with its flag off, `FeatureFlagGuard` refuses at the gate with
  `501 { error: "module_disabled" }`, before authentication is even considered;
- with its flag **on**, the request reaches the service, which refuses with
  `501 { error: "<module>_inactive" }`.

So setting `PROOF_OF_RESERVES_ENABLED=true` does not create an attestation
surface; it changes which refusal you get. The services touch no database and
their tables are empty and must stay so. This is deliberate: a gated module must
not be wired to real logic even behind a flag that defaults on.

Making any of them work is a code change — a reviewed piece of work requiring a
finalized legal structure, an independent contract audit, a penetration test and
written authorization — not a configuration change an administrator can make.

The table below is the **intended** behaviour if and when they are implemented.
None of it happens today.

| Module | Flag | Intended behaviour once implemented |
| --- | --- | --- |
| Proof-of-Reserves | `PROOF_OF_RESERVES_ENABLED` | create/publish reserve attestations (ratio = verified / circulating) |
| Redemption | `REDEMPTION_ENABLED` | investor redemption requests; multi-approval before settle |
| Wallet | `WALLET_ENABLED` | investors link an EVM address (Sepolia only) |
| Purchase | `PURCHASE_ENABLED` | purchase intents; requires KYC approved + wallet linked |

> Everything in §4.1–§4.3 describes intent, not behaviour. No reserve figure,
> custodian, auditor, vault or coverage ratio exists in this system, and none
> may be introduced as sample data.

### 4.1 Proof-of-Reserves (when implemented and authorized)
- **Compliance/Admin** create an attestation (period, circulating supply, verified reserve → ratio auto-computed, status `draft`).
- **Admin** publishes it; the public status endpoint then serves the latest published attestation.

### 4.2 Redemption (when implemented and authorized)
- Investor (KYC-approved) submits a request. Staff approve; it flips to `approved` once approvals ≥ required (multisig-style, default 2). **Admin** settles only after approval. Rejections carry a reason.

### 4.3 Wallet & Purchase (when implemented and authorized)
- Investors would link a Sepolia EVM address; mainnet chain ids are rejected by
  validation, not merely discouraged. Purchase intents would require **KYC
  approved AND wallet linked**. Today every one of these routes returns `501`
  before any such check runs, and no private key, mnemonic or seed phrase is
  held anywhere in this system — linking an address never requires custody of
  its key.

---

## 5. Routine admin tasks
- **Create staff accounts** with the least-privilege role.
- **Rotate secrets** (`JWT_SECRET`, `INVESTOR_JWT_SECRET`, `PAYLOAD_SECRET`,
  `SERVICE_API_TOKEN`, DB password) periodically — see the Ops Runbook. The
  three signing keys must all differ from one another; the services refuse to
  start otherwise.
- **Review the audit log** after any incident or sensitive change.
- **Back up** before bulk edits or config changes.

---

## 6. Do / Don't

**Do**
- Keep everything testnet and clearly illustrative.
- Require KYC approval before any investor-gated action.
- Attribute and document decisions (they're audited).

**Don't**
- Enable any sensitive flag or mainnet without written sign-off.
- Expose internal passport fields publicly.
- Share service tokens. There are no seed credentials to change — the seed
  commits none.
- Describe the screening stub, or any figure in this system, as a real result.
