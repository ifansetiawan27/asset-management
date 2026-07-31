import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { tenantStorage } from '../shared/tenant/tenant-context';
import { AuthUser } from './auth-user.interface';

/** Klaim token JWT lokal (diterbitkan AuthService).
 *  Format AMS: { sub, email, roles[], tenantId }
 *  Format Keycloak (legacy, untuk kompatibilitas): { realm_access.roles, tenant_id }
 */
interface LocalJwtPayload {
  sub: string;
  email?: string;
  // AMS format
  roles?: string[] | string;
  tenantId?: string;
  // Keycloak / legacy format (fallback)
  preferred_username?: string;
  name?: string;
  tenant_id?: string;
  realm_access?: { roles?: string[] };
}

/**
 * Verifikasi JWT lokal (HS256) yang ditandatangani API dengan JWT_SECRET.
 * Menggantikan verifikasi Keycloak/JWKS sebelumnya.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: (() => {
      const s = config.get<string>('jwt.secret');
      if (!s) throw new Error('JWT_SECRET tidak dikonfigurasi. Set JWT_SECRET di .env.');
      return s;
    })(),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: LocalJwtPayload): AuthUser {
    // Ambil roles dari AMS (roles) atau Keycloak (realm_access.roles).
    const rawRoles = payload.roles ?? payload.realm_access?.roles ?? [];
    let roles: string[];
    if (Array.isArray(rawRoles)) {
      roles = rawRoles.filter(Boolean).map(String);
    } else if (typeof rawRoles === 'string') {
      // Kadang roles dikirim sebagai string csv
      roles = rawRoles.split(',').map((r) => r.trim()).filter(Boolean);
    } else {
      roles = [];
    }

    // Normalisasi tenantId: dukung tenantId (camelCase) dan tenant_id (snake_case)
    let tenantId: string | null = (payload.tenantId ?? payload.tenant_id) ?? null;
    if (tenantId !== null && tenantId !== undefined) {
      tenantId = String(tenantId);
    } else {
      tenantId = null;
    }

    // Cegah spoofing lintas tenant: header (jika ada) harus cocok klaim token.
    const headerRaw = req.headers['x-tenant-id'];
    const headerTenant = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;
    const headerTenantStr = headerTenant ? String(headerTenant) : null;
    if (tenantId && headerTenantStr && headerTenantStr !== tenantId) {
      throw new ForbiddenException('TENANT_MISMATCH');
    }

    // Tenant dari token bersifat otoritatif -> perbarui konteks tenant request.
    const store = tenantStorage.getStore();
    if (store && tenantId) {
      store.tenantId = tenantId;
    }

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Token tidak valid: sub kosong.');
    }

    return {
      sub: payload.sub,
      email: payload.email ?? null,
      username: payload.preferred_username ?? payload.email ?? null,
      tenantId,
      roles,
    };
  }
}
