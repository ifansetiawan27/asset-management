import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../shared/auth/public.decorator';
import { tenantStorage } from '../shared/tenant/tenant-context';

const ALL_ROLES = [
  'SUPER_ADMIN',
  'ASSET_ADMINISTRATOR',
  'PROCUREMENT',
  'TECHNICIAN',
  'AUDITOR',
  'DEPARTMENT_MANAGER',
  'EMPLOYEE',
];

/**
 * Guard autentikasi global berbasis strategi 'jwt' (Keycloak).
 * Route yang ditandai @Public() dilewati tanpa verifikasi token.
 *
 * DEV ONLY: bila AUTH_DEV_BYPASS=true, guard mengisi request.user dari header
 * (X-Tenant-ID, X-Dev-Roles) tanpa verifikasi JWT — agar frontend dapat berjalan
 * tanpa Keycloak. JANGAN aktifkan di produksi.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (this.config.get<boolean>('auth.devBypass')) {
      const req = context.switchToHttp().getRequest<Request>();
      const headerTenant = req.headers['x-tenant-id'];
      const tenantId =
        (Array.isArray(headerTenant) ? headerTenant[0] : headerTenant) ??
        this.config.get<string>('auth.devTenantId') ??
        null;
      const rolesHeader = req.headers['x-dev-roles'];
      const roles = rolesHeader
        ? String(rolesHeader).split(',').map((r) => r.trim())
        : ALL_ROLES;

      (req as Request & { user: unknown }).user = {
        sub: '00000000-0000-0000-0000-000000000001',
        email: 'dev@local',
        username: 'dev',
        tenantId,
        roles,
      };
      const store = tenantStorage.getStore();
      if (store && tenantId) {
        store.tenantId = tenantId;
      }
      return true;
    }

    return super.canActivate(context);
  }
}
