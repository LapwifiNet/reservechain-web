# ReserveChain P4 wallet and key-management artifacts

This directory contains documentation and configuration templates for the ReserveChain P4 wallet,
treasury, multisig, and key-management workflow.

## Contents

- `wallets.example.json` — placeholder template for Safe addresses, operators, and signer metadata.
- `safe-setup-checklist.md` — step-by-step checklist for creating and configuring the Safe wallets.
- `roles-matrix.md` — role-to-holder mapping for admin, treasury, and operational responsibilities.

## Notes

- Keep real values in an untracked `wallets.json` file locally.
- Do not commit real addresses, private keys, or signer metadata.
- Safe creation and role grants are manual, testnet-only operations performed later via the Safe UI and the Foundry role-grant script.
