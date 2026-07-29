import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Payload pendaftaran akun (email/password). */
export class RegisterDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Nama lengkap minimal 2 karakter' })
  @MaxLength(150)
  fullName: string;

  // Batas 72 byte mengikuti batas algoritma bcrypt.
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(72, { message: 'Password maksimal 72 karakter' })
  password: string;
}
