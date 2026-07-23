import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PassportsService {
  constructor(private readonly prisma: PrismaService) {}

  list(take = 100) {
    return this.prisma.passport.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { assetRecord: { include: { program: true } } },
    });
  }

  async byId(passportId: string) {
    const p = await this.prisma.passport.findUnique({
      where: { passportId },
      include: { assetRecord: { include: { program: true } } },
    });
    if (!p) throw new NotFoundException('passport_not_found');
    return p;
  }
}
