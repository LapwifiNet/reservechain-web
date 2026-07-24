import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Role } from "../enums/role.enum";

/**
 * Verifies a Bearer token on the request.
 * - Accepts a long-lived SERVICE_API_TOKEN (used by trusted server-to-server
 *   callers such as the admin console) and treats it as an admin service principal.
 * - Otherwise verifies a signed JWT issued by /api/auth/login.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers["authorization"] ?? "";
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("missing_bearer_token");
    }

    const serviceToken = this.config.get<string>("SERVICE_API_TOKEN");
    if (serviceToken && token === serviceToken) {
      req.user = {
        email: "service@reservechain",
        role: Role.ADMIN,
        service: true,
      };
      return true;
    }

    try {
      const payload = await this.jwt.verifyAsync(token);
      req.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException("invalid_token");
    }
  }
}
