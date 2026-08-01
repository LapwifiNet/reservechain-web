import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response shapes for the asset catalogue and registry.
 *
 * `AssetProgramSummary` and `AssetProgramDetail` are separate because
 * `GET /assets/programs` returns rows with no `records` and
 * `GET /assets/programs/:code` includes them. The hand-written admin type had
 * one `AssetProgram` with `records?: AssetRecord[]`, which types the list
 * response as if the field might be there — it never is.
 */

export class AssetProgramSummary {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Short program code, e.g. the copper or nickel program.' })
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  metal!: string;

  @ApiProperty({ description: 'Illustrative until supporting evidence is published.' })
  purity!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class AssetRecordSummary {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  programId!: string;

  @ApiProperty({ nullable: true, type: String })
  batch!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Illustrative. No published weight is evidence-backed yet.',
  })
  weightKg!: number | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** `GET /assets/programs/:code` — the program with its records included. */
export class AssetProgramDetail extends AssetProgramSummary {
  @ApiProperty({ type: [AssetRecordSummary] })
  records!: AssetRecordSummary[];
}

/** `GET /assets/registry` — records with their program included. */
export class AssetRecordWithProgram extends AssetRecordSummary {
  @ApiProperty({ type: AssetProgramSummary })
  program!: AssetProgramSummary;
}
