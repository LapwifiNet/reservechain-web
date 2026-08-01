import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { AuthLoginResult } from './dto/auth.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async validate(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('invalid_credentials');
    const ok = await bcryptjs.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid_credentials');
    return user;
  }

  async login(email: string, password: string): Promise<AuthLoginResult> {
    const user = await this.validate(email, password);
    const role = (user.role as Role) ?? Role.VIEWER;
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role,
      // Explicit token domain (P8). JwtAuthGuard rejects any JWT without
      // typ='admin', so an investor-portal token — different typ AND a
      // different signing secret — can never authenticate an admin route.
      typ: 'admin',
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, role },
    };
  }
}
