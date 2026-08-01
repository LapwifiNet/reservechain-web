import { ApiProperty } from '@nestjs/swagger';
import { AssetRecordWithProgram } from '../../assets/dto/assets.response.dto';

/**
 * `GET /passports` and `GET /passports/:passportId`.
 *
 * Both include the asset record and, through it, the program. The admin type
 * declared `assetRecord?: AssetRecord` — optional, and with a program that was
 * also optional — so every read of `p.assetRecord.program.name` needed two
 * guards the runtime never required.
 */
export class PassportResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  passportId!: string;

  @ApiProperty()
  assetRecordId!: string;

  @ApiProperty({ description: 'Always `Illustrative` until a real template is authorised.' })
  template!: string;

  @ApiProperty({ nullable: true, type: String })
  purity!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  issuedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: AssetRecordWithProgram })
  assetRecord!: AssetRecordWithProgram;
}
