# P22 — Warranty, Post-Launch Support & Exit Assistance (Scope)

> Status: **backlog — scope proposal, not agreed terms.** There is no
> engagement, retainer or contract for ReserveChain (contest entry only).
> This document defines the *shape* of a P22 warranty/support offer so the
> owner can review it before any agreement is drafted. Nothing here binds
> either party.

## 1. Objectives

- Give the issuer a defined, bounded support window after launch instead of
  an open-ended "we will fix things" promise.
- Make the boundary between *covered work* and *owner-paid work* explicit
  (mirrors §5.4 of the Build Plan).
- Provide an orderly exit: what happens to access, knowledge and
  responsibility when the engagement ends.

## 2. Warranty window

| Item | Proposal |
|---|---|
| Duration | **90 days** from production launch (P20), or from handover (P21), whichever is later |
| Defect class | Defects in code delivered under the engagement that reproduce on the agreed environments |
| Response targets | Critical (data loss / security / full outage): acknowledge ≤ 1 business day · fix committed ≤ 5 business days |
| | Major (feature broken, workaround exists): acknowledge ≤ 2 business days · fix ≤ 10 business days |
| | Minor: batched into the next maintenance release |
| Exclusions | See §4 |

## 3. Post-launch support (after the warranty window)

| Tier | What it includes | Basis |
|---|---|---|
| A — Retainer | Priority fixes, patching, release management, monitoring triage, monthly report | Time-and-materials or monthly retainer, agreed separately |
| B — On-call | Incident response outside business hours | Per-incident or per-week retainer |
| C — Self-service | Repo, manuals, runbook, training videos remain with the issuer; fixes via issue tracker | Included in handover (P21) |

## 4. Exclusions (not covered by any warranty)

- Third-party services and their outages: AWS, Sentry, mail provider, KYC
  provider, exchanges, app stores, DNS registrar.
- Changes requested after launch (new features, copy changes, new assets).
- Issues caused by the issuer's own infrastructure changes, credentials
  handling, or use of the system in a way not documented in the manuals.
- Legal/regulatory work: token classification changes, new-jurisdiction
  analysis, provider contracts.
- Data entry, migrations, or integrations not delivered under the engagement.
- Anything requiring mainnet changes without written authorization.
- Force majeure.

## 5. Exit assistance

On termination or completion, the developer will:

1. Hand over all repo access, credentials and service ownership already
   transferred at P21 (nothing retained that the issuer does not have).
2. Provide a final known-issues list (bugs, limitations, follow-ups) with
   severity and suggested owners.
3. Provide a handover summary: what was delivered, what was deferred, what
   needs monitoring.
4. Transfer or delete any remaining personal access (CI tokens, deploy keys,
   store accounts) and confirm deletion in writing.
5. No continued access to production systems after exit unless a retainer
   (Tier A/B) is in place.

## 6. What P22 does NOT include

- Market-maker, exchange listing or CMC/CoinGecko follow-up (owner-driven).
- Store resubmissions beyond the initial TestFlight/Play submission.
- Regulatory filings or legal opinions.
- Ongoing marketing.
