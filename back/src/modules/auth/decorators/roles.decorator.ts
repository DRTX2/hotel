import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Roles mínimos para el endpoint. Jerárquico: admin ⊃ staff ⊃ guest.
 * Sin decorador = cualquier usuario autenticado.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
