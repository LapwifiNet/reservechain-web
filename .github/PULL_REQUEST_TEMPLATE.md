## What this changes

A short description of the change and why it is needed. Link any related issue.

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation
- [ ] Refactor / chore

## Component

- [ ] Website (`src/`)
- [ ] API (`api/`)
- [ ] Admin console (`admin/`)
- [ ] CMS (`cms/`)
- [ ] Contracts (`contracts/`)
- [ ] Mobile (`mobile/`)
- [ ] Infrastructure (`infra/`)
- [ ] Docs

## How this was tested

Describe what you actually ran, not what you intended to run.

```bash
npm run lint
npm run typecheck
npm test
npm run verify:screens
# cd contracts && forge test
```

## Safety checklist

- [ ] No mainnet RPC URL, mainnet chain ID, or mainnet deploy step was added.
- [ ] No feature flag default was changed from `false` to `true`.
- [ ] `FeatureFlagGuard`, `JwtAuthGuard` and `RolesGuard` are not weakened or bypassed.
- [ ] No credential, private key, seed phrase, `.env` file, or real personal data is included.
- [ ] No default password or default hostname was introduced.
- [ ] Audit-trail coverage is unchanged or improved for any new mutating endpoint.
- [ ] `docs/spec/screens.yaml` updated if a screen was added or renamed.

## Reviewer notes

Call out anything touching authentication, RBAC, the audit trail, the feature flags, or the
contracts — those get a closer review.
