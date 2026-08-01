import { ApiProperty } from '@nestjs/swagger';

/**
 * `GET /tokenomics`.
 *
 * The route returns `TokenomicsConfig.data`, a Prisma `Json` column, or a
 * hardcoded fallback when the row is absent. The class below documents the
 * fallback's shape, which is what the admin console reads — but the column is
 * unvalidated, so a row written with any other shape is served as-is.
 *
 * This is the one response on the API whose runtime shape is not enforced by
 * anything. It is called out in docs/API-TYPES.md rather than papered over: a
 * generated client will present these fields, and they are only guaranteed for
 * the fallback.
 */
export class TokenomicsAllocation {
  @ApiProperty()
  bucket!: string;

  @ApiProperty()
  pct!: number;
}

export class TokenomicsResponse {
  @ApiProperty()
  symbol!: string;

  @ApiProperty({ description: 'Illustrative. Not a committed supply.' })
  capIllustrative!: string;

  @ApiProperty({ description: 'Illustrative. Not a committed ratio.' })
  reserveRatio!: string;

  @ApiProperty()
  transferFee!: string;

  @ApiProperty({ type: [TokenomicsAllocation] })
  allocations!: TokenomicsAllocation[];

  @ApiProperty()
  note!: string;
}
