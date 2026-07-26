import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { tenantStorage } from '../shared/tenant/tenant-context';
import { AuthUser } from './auth-user.interface';

/** Bentuk klaim token Keycloak yang relevan. */
interface KeycloakJwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  tenant_id?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly clientId: string;

  constructor(config: ConfigService) {
    const issuer = config.get<string>('keycloak.issuer') ?? '';
    const jwksUri = config.get<string>('keycloak.jwksUri') ?? '';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer,
      passReqToCallback: true,
      // Ambil kunci publik dari JWKS Keycloak (di-cache) untuk verifikasi tanda tangan.
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
    });

    this.clientId = config.get<string>('keycloak.clientId') ?? 'ams-api';
  }

  validate(req: Request, payload: KeycloakJwtPayload): AuthUser {
    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = payload.resource_access?.[this.clientId]?.roles ?? [];
    const roles = Array.from(new Set([...realmRoles, ...clientRoles]));

    const tenantId = payload.tenant_id ?? null;

    // Cegah spoofing lintas tenant: header (jika ada) harus cocok dengan klaim token.
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
