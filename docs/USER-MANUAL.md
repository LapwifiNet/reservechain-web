# OpenRWA — User Manual

Audience: website visitors and registered investors. Version: prelaunch
(testnet only).

> **Status.** This describes the software as built. It is not deployed anywhere:
> there is no hosted site, so every instruction below refers to a local or
> future deployment. Sections describing features as unavailable are describing
> a permanent property of this build, not a temporary state.

> **Important:** OpenRWA is in development. Nothing on the site is an offer or sale. All figures are **illustrative**. Registering interest does not constitute an investment, token purchase, asset reservation, allocation, or entitlement to any future offering. Any future availability is subject to final legal structure, definitive documentation, asset verification, jurisdictional eligibility, KYC/KYB, sanctions screening and approval.

---

## 1. Getting started

### 1.1 Languages
The site is available in **English, Español, Italiano**. Use the language switcher in the header; your choice is reflected in the URL
(`/en`, `/es`, `/it`) and carried as you follow links within the site.

### 1.2 Navigation
- **Home** — overview of the platform and the industrial-metals-backed concept.
- **Programs** — the two asset programs:
  - **Copper Powder** (illustrative purity 99.9999%).
  - **Nickel Wire** (illustrative purity 99.9807%).
- **Digital Asset Passports** (`/passports`) — provenance records published
  from the CMS. The list is empty unless a CMS instance is running with
  published passports; there is no built-in sample.
- **Waitlist / Register interest** — the multi-step form.

---

## 2. Understanding the pages

### 2.1 Program pages
Each program page shows the metal type, illustrative purity and certificate reference, and how it maps (illustratively) to the token. A prelaunch disclosure appears on every page. Figures labeled *illustrative* are examples only.

### 2.2 Digital Asset Passports
A Passport is a provenance sheet published from the CMS: title, program, metal,
purity, a list of provenance highlights, and the prelaunch disclosure. What you
see publicly is a sanitized projection — internal registry records are not
exposed, and the on-chain token mapping is omitted entirely unless an
administrator has explicitly activated it, which has not happened.

Passports are **program-level**, not per-lot. An earlier per-unit page at
`/passport/<id>` was removed: it rendered invented content with no data source
behind it. Old links redirect to `/passports`.

---

## 3. Joining the waitlist

1. Open **Register interest / Waitlist**.
2. **Step 1 — Your details:** name and email.
3. **Step 2 — Profile:** investor type (required), plus optional organization
   and area of interest.
4. **Step 3 — Eligibility & consent:** read the disclosure and tick the consent box. You cannot submit without consenting.
5. Submit. You'll see a confirmation. Your entry is stored by the API, and the
   submission is recorded in the internal audit log with your name and email
   redacted from the record's body.

**Notes**
- Submitting only registers *interest*. It reserves nothing and commits you to nothing.
- Use a valid email — it's how you'd be contacted if/when there is anything to share.
- If submission fails, check required fields and the consent box, then retry.

---

## 4. Investor portal

The investor portal is open self-service registration — there is no per-account
enablement and no invitation step.

### 4.1 Create an account
- Go to the investor area and **Register** with email, full name and a password.
- **Log in** to receive a secure session (valid ~12 hours).

### 4.2 Your status
- **Status** is a read-only summary: your account details, your waitlist
  registration if the same email is on it, your verification status, and the
  published program catalogue. It is the only thing the portal does.
- There are no gated actions waiting behind KYC approval. Redemption, wallet
  linking and purchase do not function at all (§5), so approval unlocks nothing
  today.

### 4.3 KYC (identity verification)
- **There is no investor-facing way to submit identity details.** The portal
  only *displays* a verification status. Cases are created and reviewed by
  compliance staff in an internal console; if verification is ever required of
  you, it will be arranged outside this software.
- A case moves *pending* → *in review* → *approved* or *rejected*.
- The sanctions-screening step is an **illustrative stub**. It performs no
  external check against any sanctions, PEP or adverse-media source, and a
  "clear" result is displayed as "Clear — illustrative stub" precisely so it is
  not mistaken for a completed screening.

---

## 5. What is NOT available yet

These four are **built as published route shapes only**. Every request to them
is refused with HTTP `501`, and they hold no data:

- **Proof-of-Reserves** attestations. The public status endpoint returns `501` —
  it does not return "no published attestation", and no reserve figure,
  custodian, auditor or coverage ratio exists anywhere in this system.
- **Redemption** requests.
- **Wallet linking**.
- **Token purchase**.

This is stronger than a feature toggle. Each refuses twice: once at the gate
while its flag is off, and again in its own service if the flag is ever turned
on. Turning a flag on activates nothing. Making any of them work is a code
change requiring a finalized legal structure, an independent contract audit, a
penetration test and written authorization.

---

## 6. Privacy & security
- Provide only the information requested. The consent step explains how your interest is recorded.
- Never share your investor password; nobody will ask you for it. A deployed
  site would serve over HTTPS; note that no deployment exists today.

---

## 7. FAQ

**Is this an investment?** No. It's a prelaunch interest registration. Nothing is offered or sold.

**Are the purity/tokenomics numbers real?** They are **illustrative** examples for demonstration.

**Can I buy tokens now?** No. Purchase, wallet, redemption and proof-of-reserves
refuse every request with `501` and store nothing. No token has been issued and
none is offered or sold.

**Which languages are supported?** English, Spanish, Italian.

**I didn't get a confirmation.** Re-check your email address and that the consent box was ticked, then submit again.
