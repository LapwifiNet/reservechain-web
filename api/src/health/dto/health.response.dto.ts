import { ApiProperty } from '@nestjs/swagger';

/** `GET /health`. Unauthenticated and unthrottled. */
export class HealthResponse {
  @ApiProperty({ enum: ['ok'] })
  status!: string;

  @ApiProperty({ enum: ['up', 'down'], description: 'Result of `SELECT 1` against the API database.' })
  db!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;
}
