import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent on email. Re-submitting an address returns the existing entry's
   * id instead of erroring, so someone filling the public form twice sees the
   * same success state rather than a failure. `email` is UNIQUE, so this cannot
   * create a duplicate row.
   */
  async create(dto: CreateWaitlistDto) {
    // Defence in depth: the DTO already requires consent === true, but the
    // service must not store a registration without recorded consent even if it
    // is ever called without the validation pipe.
    if (!dto.consent) throw new BadRequestException('consent_required');

    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { email: dto.email },
    });
    if (existing) return { ok: true, id: existing.id };

    try {
      const entry = await this.prisma.waitlistEntry.create({ data: { ...dto } });
      return { ok: true, id: entry.id };
    } catch (e: any) {
      // Two submissions of the same address can race between the lookup and the
      // insert; the unique index wins and we return the row that landed.
      if (e?.code === 'P2002') {
        const row = await this.prisma.waitlistEntry.findUnique({
          where: { email: dto.email },
        });
        if (row) return { ok: true, id: row.id };
      }
      throw e;
    }
  }

  count() {
    return this.prisma.waitlistEntry.count();
  }

  // NOTE: admin-only surface. Protect behind auth/RBAC in P6/P9.
  list(take = 50) {
    return this.prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
