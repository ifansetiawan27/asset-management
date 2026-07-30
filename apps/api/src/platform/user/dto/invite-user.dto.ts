import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { SystemRole } from '../../../shared/rbac/roles.enum';

export class InviteUserDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Nama lengkap minimal 2 karakter' })
  @MaxLength(150)
  fullName: string;

  @IsEnum(SystemRole, { message: 'Peran tidak valid' })
  roleCode: SystemRole;

  /** Password awal — admin berbagi ke pengguna yang diundang. */
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(72)
  password: string;
}
