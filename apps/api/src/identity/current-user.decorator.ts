import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthUser } from './auth-user.interface';

interface RequestWithUser {
  user?: AuthUser;
}

/** Menyediakan objek AuthUser dari request pada parameter handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
