import { IsEmail, IsString, MinLength } from 'class-validator';

/** Payload login (email/password). */
export class LoginDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
