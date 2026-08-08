import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenomicsResponse } from './dto/tokenomics.response.dto';

const FALLBACK = {
  symbol: 'ORWA',
  capIllustrative: '100000000',
  reserveRatio: '1:1',
  transferFee: '0',
  allocations: [
    { bucket: 'Reserve-backed circulating', pct: 60 },
    { bucket: 'Treasury', pct: 20 },
    { bucket: 'Ecosystem & operations', pct: 12 },
    { bucket: 'Team (vested)', pct: 8 },
  ],
  note: 'Illustrative — not final. Requires written authorization from the issuer.',
};

@Injectable()
export class TokenomicsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FOUND BY DECLARING THIS TYPE: the stored value is unvalidated.
   *
   * `TokenomicsConfig.data` is a Prisma `Json` column with no schema, no DTO
   * and no validation on write. The declared return type is the FALLBACK's
   * shape — which is what the admin console has always assumed — but a row
   * written with any other shape is served as-is, and `Json` widens to
   * `string | number | boolean | JsonObject | JsonArray`, so the compiler
   * rejected the assignment outright.
   *
   * Behaviour is deliberately unchanged: adding a runtime guard here would be
   * a behaviour change in a typing round. The cast is isolated to this one
   * line, and it is the only place in the API where a declared response shape
   * is not guaranteed by anything. Recorded in docs/API-TYPES.md.
   */
  async get(): Promise<TokenomicsResponse> {
    const row = await this.prisma.tokenomicsConfig.findUnique({
      where: { key: 'default' },
    });
    return (row?.data as unknown as TokenomicsResponse) ?? FALLBACK;
  }
}
