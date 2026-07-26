import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInvestorDto } from './dto/register-investor.dto';
import { LoginInvestorDto } from './dto/login-investor.dto';

type InvestorRow = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  createdAt: Date;
};

@Injectable()
export class InvestorService {
  constructor(
    private readonly prisma: PrismaService,
    // InvestorModule's JwtService — signs with INVESTOR_JWT_SECRET.
    private readonly jwt: JwtService,
  ) {}

  private sign(investor: { id: string; email: string }) {
    return this.jwt.signAsync({
      sub: investor.id,
      email: investor.email,
      // Explicit token domain. InvestorJwtGuard requires exactly this value;
      // the admin JwtAuthGuard requires typ='admin', so this token can never
      // cross over even if the secrets were ever misconfigured to match.
      typ: 'investor',
    });
  }

  private toPublic(i: InvestorRow) {
    return {
      id: i.id,
      email: i.email,
      fullName: i.fullName,
      memberSince: i.createdAt,
    };
  }

  async register(dto: RegisterInvestorDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.investorUser.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException('email_already_registered');
    const passwordHash = await bcryptjs.hash(dto.password, 10);
    const investor = await this.prisma.investorUser.create({
      data: { email, fullName: dto.fullName.trim(), passwordHash },
    });
    return {
      accessToken: await this.sign(investor),
      investor: this.toPublic(investor),
    };
  }

  async login(dto: LoginInvestorDto) {
    const email = dto.email.toLowerCase().trim();
    const investor = await this.prisma.investorUser.findUnique({
      where: { email },
    });
    if (!investor) throw new UnauthorizedException('invalid_credentials');
    const ok = await bcryptjs.compare(dto.password, investor.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid_credentials');
    return {
      accessToken: await this.sign(investor),
      investor: this.toPublic(investor),
    };
  }

  async me(email: string) {
    const investor = await this.prisma.investorUser.findUnique({
      where: { email },
    });
    if (!investor) throw new UnauthorizedException('investor_not_found');
    return this.toPublic(investor);
  }

  // Aggregated read-only status: profile + waitlist entry + latest KYC case +
  // the public program catalogue. Informational only — nothing here changes
  // state, and no sensitive/offer data is exposed.
  async status(email: string) {
    const [investor, waitlist, kyc, programs] = await Promise.all([
      this.prisma.investorUser.findUnique({ where: { email } }),
      this.prisma.waitlistEntry.findUnique({ where: { email } }),
      this.prisma.kycCase.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assetProgram.findMany({ orderBy: { code: 'asc' } }),
    ]);

    return {
      profile: investor
        ? this.toPublic(investor)
        : { id: null, email, fullName: email, memberSince: null },
      waitlist: waitlist
        ? {
            investorType: waitlist.investorType,
            organization: waitlist.organization,
            interest: waitlist.interest,
            joinedAt: waitlist.createdAt,
          }
        : null,
      kyc: kyc
        ? {
            status: kyc.status,
            // Nullable in our schema (unlike the P8 snapshot's defaults);
            // surface the same wire values the portal UI translates.
            riskLevel: kyc.riskLevel ?? 'unrated',
            sanctions: kyc.sanctions ?? 'not_screened',
          }
        : {
            status: 'not_started',
            riskLevel: 'unrated',
            sanctions: 'not_screened',
          },
      programs: programs.map((p) => ({
        code: p.code,
        name: p.name,
        metal: p.metal,
        purity: p.purity,
        status: p.status,
      })),
    };
  }
}
