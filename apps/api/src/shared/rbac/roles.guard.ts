import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator';
import { SystemRole } from './roles.enum';

interface RequestWithUser {
  user?: { roles?: string[] };
}

/**
 * Guard RBAC. Membaca role pengguna dari `request.user.roles`.
 *
 * Catatan: pengisian `request.user` (dari token OIDC Keycloak) ditambahkan
 * pada Step 3 (Identity). Untuk saat ini guard menegakkan aturan bila
 * `@Roles()` dipasang dan menolak akses ketika informasi role belum tersedia.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<SystemRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRoles = request.user?.roles ?? [];
    const allowed = required.some((role) => userRoles.includes(role));

    if (!allowed) {
      throw new ForbiddenException('Role tidak mencukupi untuk aksi ini.');
    }
    return true;
  }
}
