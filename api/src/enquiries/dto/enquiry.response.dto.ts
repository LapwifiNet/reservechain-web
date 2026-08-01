import { ApiProperty } from '@nestjs/swagger';

export class EnquiryCreated {
  @ApiProperty() ok: boolean;
  @ApiProperty() id: string;
}

export class EnquiryResponse {
  @ApiProperty() id: string;
  @ApiProperty() kind: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty({ required: false }) company?: string | null;
  @ApiProperty() message: string;
  @ApiProperty() locale: string;
  @ApiProperty() createdAt: string;
}
