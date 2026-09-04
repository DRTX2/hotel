import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TokenPayload } from '../decorators/current-user.decorator';

/** Nivel jerárquico: admin (3) ⊃ staff (2) ⊃ guest (1). */
const LEVEL: Record<UserRole, number> = {
  [UserRole.GUEST]: 1,
  [UserRole.STAFF]: 2,
  [UserRole.ADMIN]: 3,
};

/**
 * Guard global (tras JwtAuthGuard): exige el nivel mínimo indicado
 * por @Roles(). Sin decorador, basta estar autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: TokenPayload }>();
    const role = request.user?.role;
    if (!role) {
      throw new ForbiddenException('Sin rol asignado');
    }

    const minLevel = Math.min(...required.map((r) => LEVEL[r]));
    if (LEVEL[role] < minLevel) {
      throw new ForbiddenException('No tienes permiso para esta operación');
    }
    return true;
  }
}
