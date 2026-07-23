import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FALLBACK = {
  symbol: 'RCM',
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

  async get() {
    const row = await this.prisma.tokenomicsConfig.findUnique({
      where: { key: 'default' },
    });
    return row?.data ?? FALLBACK;
  }
}
