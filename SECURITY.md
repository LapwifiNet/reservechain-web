# Security policy

## Status

OpenRWA is pre-1.0 open-source software. Nothing is deployed by the project, no
token exists on any mainnet, and the contracts have **not** had an independent
audit. Treat this repository as a reference implementation to build on, not as
production-ready infrastructure.

If you deploy it, you are the operator, and the security of that deployment is
yours.

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Tagged releases | Latest only |
| Forks | No |

## Reporting a vulnerability

Email **t@lapwifi.net** with:

- what the issue is and where it lives (file, endpoint, contract function)
- how to reproduce it
- what an attacker gets

Please do not open a public issue for anything exploitable. Expect an
acknowledgement within 7 days. There is no bug bounty; this is unfunded open
source. Every valid report gets credit in the release notes unless you ask
otherwise.

## In scope

Authentication and session handling, role-based access control, the audit trail
and its hash chain, feature-flag gating, KYC data handling, the Solidity
contracts, CI workflow injection, and secret handling in the Docker and
Terraform templates.

## Out of scope

Anything requiring a compromised operator machine, social engineering, missing
hardening in `*.example` files that exist to be replaced, rate limits on a local
dev stack, and third-party services an operator chooses to plug in.

## Hardening already in place

- Four separate secrets, each validated at boot for length and uniqueness; the
  stack refuses to start otherwise
- `FeatureFlagGuard` runs before authentication, so disabled modules return
  `501` without revealing whether a credential was valid
- Audit records are hash-chained and written under `pg_advisory_xact_lock`, so
  concurrent writes cannot fork the chain
- `WAITLIST_API_BASE` and service tokens are server-side only
- Token status cannot be advanced past `testnet-deployed`

## Known issues

Open, tracked, and deliberately public:

| Area | Issue |
| --- | --- |
| KYC | `KycService.screen()` reports a `screenedAt` value it does not persist, and records no actor |
| Audit | Participant `register` and `login` mutate state but are not audited |
| Admin | `/kyc/[id]` permalinks were dropped during a refactor |
| Data model | `reviewedBy` is set without `reviewedAt` on `RedemptionRequest` and `PurchaseIntent` |
| Data model | `Wallet.verified` is set without `verifiedAt` |
| Redemption | The dual-approval counter does not record distinct approver identities, so one approver could satisfy both slots |
| Contracts | No independent audit. Do not deploy to mainnet. |

Fixed, and kept here for the record: the audit-chain test flakiness (three root
causes, an un-awaited rxjs `tap` replaced with `concatMap`, a race in
`AuditService.record()` closed with an advisory lock, and parallel Jest workers
sharing one database, now pinned to `maxWorkers: 1`), and the missing
`reviewedAt` in `KycService.review()`.

## Before you deploy anything

1. Get the contracts audited independently.
2. Rotate every secret. Never reuse the `*.example` values.
3. Move contract roles to a multisig.
4. Work through `docs/ACCEPTANCE-CHECKLIST.md`.
5. Get your own legal advice. This software makes no offer and enables none by
   default. Changing that is entirely your decision and your liability.
