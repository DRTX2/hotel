import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export interface TokenPayload {
  sub: string; // publicId del usuario
  email: string;
  role: UserRole;
}

/** Extrae el payload JWT validado por JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (data: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: TokenPayload }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
