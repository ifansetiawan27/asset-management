import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Public } from '../shared/auth/public.decorator';
import { AuthService } from './auth.service';
import { AuthUser } from './auth-user.interface';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  /** Login via Keycloak (proxy password grant). Mengembalikan access token. */
  @Public()
  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

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
