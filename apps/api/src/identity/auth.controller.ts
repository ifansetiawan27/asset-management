import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Public } from '../shared/auth/public.decorator';
import { AuthUser } from './auth-user.interface';
import { CurrentUser } from './current-user.decorator';

@Controller()
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  /** Info konfigurasi OIDC publik untuk klien (frontend/mobile) memulai login. */
  @Public()
  @Get('auth/config')
  authConfig(): Record<string, string | undefined> {
    const issuer = this.config.get<string>('keycloak.issuer');
    return {
      issuer,
      realm: this.config.get<string>('keycloak.realm'),
      clientId: this.config.get<string>('keycloak.clientId'),
      authorizationUrl: `${issuer}/protocol/openid-connect/auth`,
      tokenUrl: `${issuer}/protocol/openid-connect/token`,
      userinfoUrl: `${issuer}/protocol/openid-connect/userinfo`,
      jwksUri: this.config.get<string>('keycloak.jwksUri'),
    };
  }

  /** Identitas pengguna terautentikasi saat ini (dari token). */
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
