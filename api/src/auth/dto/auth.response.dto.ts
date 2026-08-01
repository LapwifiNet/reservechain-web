import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class AuthUser {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}

/** `POST /auth/login`. Admin domain (typ=admin). */
export class AuthLoginResult {
  @ApiProperty({ description: 'Admin-domain JWT. Not accepted by any investor route.' })
  accessToken!: string;

  @ApiProperty({ type: AuthUser })
  user!: AuthUser;
}

/**
 * `GET /auth/me` — the decoded token claims, not a database read.
 *
 * `sub` is absent on a service-principal token, which is why it is optional
 * here and required on AuthUser. `service` marks the machine principal, which
 * is denied on state-changing routes.
 */
export class AuthMe {
  @ApiPropertyOptional()
  sub?: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiPropertyOptional()
  service?: boolean;
}
