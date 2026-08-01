import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReconcileExceptionSummary {
  @ApiProperty() id: string;
  @ApiProperty() runId: string;
  @ApiProperty() code: string;
  @ApiProperty() severity: string;
  @ApiProperty() message: string;
  @ApiPropertyOptional() data?: unknown;
  @ApiProperty() resolved: boolean;
  @ApiPropertyOptional() resolvedBy?: string | null;
  @ApiPropertyOptional() resolvedAt?: string | null;
}

export class ReconcileRunResponse {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() summary?: unknown;
  @ApiPropertyOptional() createdBy?: string | null;
  @ApiProperty() startedAt: string;
  @ApiProperty() finishedAt: string;
  @ApiPropertyOptional({ type: [ReconcileExceptionSummary] })
  exceptions?: ReconcileExceptionSummary[];
}
