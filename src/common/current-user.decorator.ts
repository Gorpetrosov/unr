import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthPayload }>();
    return request.user;
  }
);
