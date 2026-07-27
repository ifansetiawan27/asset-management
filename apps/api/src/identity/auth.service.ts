import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

/**
 * Login via Keycloak Resource Owner Password Credentials (proxy server-side).
 * Menghindari CORS di browser dan menjaga alur token tetap terpusat.
 */
@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ accessToken: string; expiresIn: number; tokenType: string }> {
    const issuer = this.config.get<string>('keycloak.issuer');
    const clientId = this.config.get<string>('keycloak.clientId');
    const url = `${issuer}/protocol/openid-connect/token`;

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId ?? 'ams-web',
      username,
      password,
      scope: 'openid',
    });

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      throw new InternalServerErrorException(
        'Tidak dapat menghubungi Keycloak. Pastikan Keycloak berjalan.',
      );
    }

    if (!res.ok) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const json = (await res.json()) as TokenResponse;
    return {
      accessToken: json.access_token,
      expiresIn: json.expires_in,
      tokenType: json.token_type,
    };
  }
}
