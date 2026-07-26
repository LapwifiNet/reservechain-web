import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Resolves the authenticated investor's email from the request (set by
// InvestorJwtGuard).
export const InvestorEmail = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.investor?.email;
  },
);
