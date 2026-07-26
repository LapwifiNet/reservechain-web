import { IsIn, IsOptional, Matches } from 'class-validator';

/** Sepolia. The only chain this platform targets until P20 (AGENTS §1). */
export const SEPOLIA_CHAIN_ID = 11155111;

export class LinkWalletDto {
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'address must be a valid EVM (0x…) address',
  })
  address!: string;

  // @IsIn, not @IsInt. The overlay accepted any integer with only a comment
  // saying mainnet was not permitted, so `chainId: 1` would have validated —
  // a published contract that accepts an Ethereum mainnet address for a
  // testnet-only platform. AGENTS §1 forbids mainnet chain IDs in code, so the
  // constraint is in the validator, not in prose.
  @IsOptional()
  @IsIn([SEPOLIA_CHAIN_ID], {
    message: `chainId must be ${SEPOLIA_CHAIN_ID} (Sepolia). Mainnet requires written authorization (P20).`,
  })
  chainId?: number;
}
