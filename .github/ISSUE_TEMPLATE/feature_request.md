---
name: Feature request
about: Suggest an improvement to OpenRWA
title: "[feat] "
labels: enhancement
---

## The problem

What are you trying to do that OpenRWA makes hard or impossible today?

## Proposed solution

What you would like to see. Sketches, API shapes and schema changes are welcome.

## Alternatives considered

What else you tried, and why it did not work.

## Component

- [ ] Website (`src/`)
- [ ] API (`api/`)
- [ ] Admin console (`admin/`)
- [ ] CMS (`cms/`)
- [ ] Contracts (`contracts/`)
- [ ] Mobile (`mobile/`)
- [ ] Infrastructure (`infra/`)
- [ ] Docs

## Safety check

OpenRWA is testnet-only and ships its sensitive modules disabled. Please confirm:

- [ ] This does not add a mainnet deploy path to the repository.
- [ ] This does not change a feature flag default from `false` to `true`.
- [ ] This does not weaken or bypass `FeatureFlagGuard`, `JwtAuthGuard` or `RolesGuard`.
- [ ] This does not make the project offer, sell, or appear to offer any token.

If you cannot tick one of these, explain why in the proposal above — it may still be a good
idea, it just needs a longer conversation.
