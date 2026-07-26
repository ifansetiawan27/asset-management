/** 7 role sistem sesuai PRD §4 User Roles. */
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ASSET_ADMINISTRATOR = 'ASSET_ADMINISTRATOR',
  PROCUREMENT = 'PROCUREMENT',
  TECHNICIAN = 'TECHNICIAN',
  AUDITOR = 'AUDITOR',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface SystemRoleDefinition {
  code: SystemRole;
  name: string;
  permissions: string[];
}

/** Katalog permission granular (resource:action). */
export const PERMISSIONS: string[] = [
  'tenant:manage',
  'user:manage',
  'role:manage',
  'asset:create',
  'asset:read',
  'asset:update',
  'asset:delete',
  'assignment:manage',
  'transfer:request',
  'transfer:approve',
  'borrowing:request',
  'borrowing:approve',
  'maintenance:work',
  'ticket:create',
  'audit:perform',
  'disposal:request',
  'disposal:approve',
  'reports:view',
  'billing:manage',
];

/** Definisi default role -> permission (baseline; dapat disesuaikan per tenant). */
export const SYSTEM_ROLE_DEFINITIONS: SystemRoleDefinition[] = [
  { code: SystemRole.SUPER_ADMIN, name: 'Super Admin', permissions: [...PERMISSIONS] },
  {
    code: SystemRole.ASSET_ADMINISTRATOR,
    name: 'Asset Administrator',
    permissions: [
      'user:manage',
      'asset:create',
      'asset:read',
      'asset:update',
      'asset:delete',
      'assignment:manage',
      'transfer:request',
      'borrowing:approve',
      'maintenance:work',
      'ticket:create',
      'audit:perform',
      'disposal:request',
      'reports:view',
    ],
  },
  {
    code: SystemRole.PROCUREMENT,
    name: 'Procurement',
    permissions: ['asset:create', 'asset:read', 'ticket:create', 'reports:view'],
  },
  {
    code: SystemRole.TECHNICIAN,
    name: 'Teknisi',
    permissions: ['asset:read', 'maintenance:work', 'ticket:create', 'reports:view'],
  },
  {
    code: SystemRole.AUDITOR,
    name: 'Auditor',
    permissions: ['asset:read', 'audit:perform', 'ticket:create', 'reports:view'],
  },
  {
    code: SystemRole.DEPARTMENT_MANAGER,
    name: 'Department Manager',
    permissions: [
      'asset:read',
      'transfer:approve',
      'borrowing:approve',
      'disposal:approve',
      'ticket:create',
      'reports:view',
    ],
  },
  {
    code: SystemRole.EMPLOYEE,
    name: 'Employee',
    permissions: ['asset:read', 'borrowing:request', 'ticket:create'],
  },
];
