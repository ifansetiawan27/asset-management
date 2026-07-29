import { Body, Controller, Get, Post } from '@nestjs/common';

import { Public } from '../shared/auth/public.decorator';
import { AuthService } from './auth.service';
import { AuthUser } from './auth-user.interface';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Pendaftaran akun baru (email/password). Mengembalikan access token. */
  @Public()
  @Post('auth/register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.fullName, dto.password);
  }

  /** Login email/password. Mengembalikan access token JWT. */
  @Public()
  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /** Identitas pengguna terautentikasi saat ini (dari token). */
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
