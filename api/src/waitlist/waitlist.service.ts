import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWaitlistDto) {
    if (!dto.consent) throw new BadRequestException('consent_required');
    try {
      const entry = await this.prisma.waitlistEntry.create({ data: { ...dto } });
      return { ok: true, id: entry.id };
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('already_registered');
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
