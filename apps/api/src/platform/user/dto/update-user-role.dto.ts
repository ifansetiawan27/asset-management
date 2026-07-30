import { IsEnum } from 'class-validator';

import { SystemRole } from '../../../shared/rbac/roles.enum';

export class UpdateUserRoleDto {
  @IsEnum(SystemRole, { message: 'Peran tidak valid' })
  roleCode: SystemRole;
}
