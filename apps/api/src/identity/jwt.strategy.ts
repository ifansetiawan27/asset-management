import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { tenantStorage } from '../shared/tenant/tenant-context';
import { AuthUser } from './auth-user.interface';

/** Klaim token JWT lokal (diterbitkan AuthService). */
interface LocalJwtPayload {
  sub: string;
  email?: string;
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
      secretOrKey: config.get<string>('jwt.secret') ?? '',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: LocalJwtPayload): AuthUser {
    const roles = payload.realm_access?.roles ?? [];
    const tenantId = payload.tenant_id ?? null;

    // Cegah spoofing lintas tenant: header (jika ada) harus cocok klaim token.
    const headerRaw = req.headers['x-tenant-id'];
    const headerTenant = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;
    if (tenantId && headerTenant && headerTenant !== tenantId) {
      throw new ForbiddenException('TENANT_MISMATCH');
    }

    // Tenant dari token bersifat otoritatif -> perbarui konteks tenant request.
    const store = tenantStorage.getStore();
    if (store && tenantId) {
      store.tenantId = tenantId;
    }

    return {
      sub: payload.sub,
      email: payload.email ?? null,
      username: payload.preferred_username ?? null,
      tenantId,
      roles,
    };
  }
}
