import { SetMetadata } from '@nestjs/common';

import { SystemRole } from './roles.enum';

export const ROLES_KEY = 'roles';

/** Menandai handler/controller dengan role yang diizinkan. */
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);
