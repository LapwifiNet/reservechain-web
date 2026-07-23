# ReserveChain — ERC-20 Smart Contract Suite (P3)

Configurable ERC-20 for the ReserveChain industrial-metals RWA platform, built with
**Solidity + Foundry + OpenZeppelin v5**. **Testnet only** until written authorization
(Build Plan P20). All token parameters are illustrative and configured at deploy time.

## Features

- **Configurable** name / symbol / cap / initial mint (constructor + env).
- **Capped supply** (`ERC20Capped`) — minting cannot exceed the cap.
- **Controlled mint** — restricted to `MINTER_ROLE`.
- **Burn** — holders can burn (`ERC20Burnable`).
- **Pausable** — `PAUSER_ROLE` can pause/unpause all transfers (emergency stop).
- **Role-based access** (`AccessControl`): `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`,
  `PAUSER_ROLE`, `REDEEMER_ROLE`, `CONFIG_ROLE`.
- **Multisig-ready** — admin role is intended to be held by a Gnosis Safe.
- **Treasury** address, updatable by `CONFIG_ROLE`.
- **Redemption burn workflow** — built but **inactive by default**; enabling requires
  `DEFAULT_ADMIN_ROLE` and issuer authorization.
- **No transfer fee** — the token has no transfer tax by design.

## Layout

```
contracts/
  src/ReserveChainToken.sol      # the token
  script/Deploy.s.sol            # testnet deploy (mainnet blocked)
  script/GrantRoles.s.sol        # dev/testnet role grants
  test/ReserveChainToken.t.sol   # Foundry test suite
  config/tokenomics.example.json # illustrative tokenomics config
  foundry.toml / remappings.txt / .env.example
```

## Setup

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 foundry-rs/forge-std

# 3. Build & test
forge build
forge test -vvv
```

## Deploy to Sepolia (testnet)

```bash
cp .env.example .env   # fill in RPC, key, addresses
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast \
  --verify --etherscan-api-key "$ETHERSCAN_API_KEY"
```

After deploy, grant operational roles to the multisig / operators (see
`GrantRoles.s.sol`, or use the Gnosis Safe UI on mainnet).

## Compliance guardrails

- **Mainnet deploy is blocked in `Deploy.s.sol`** (`chainid == 1` reverts). Mainnet /
  TGE requires written authorization (P20).
- Token parameters are **illustrative**; confirm with the issuer before any real deploy.
- **Redemption is inactive by default** and must not be enabled without authorization.
- Do not hard-code supply / price / allocation / reserve ratios — keep them in config.

## Test coverage

Metadata, admin roles, controlled mint, cap enforcement, burn, pause/unpause, role
restrictions, redemption inactive-by-default + post-activation flow, treasury update,
and a fuzz test for minting within the cap. Target ≥ 90% coverage before audit (P18).
