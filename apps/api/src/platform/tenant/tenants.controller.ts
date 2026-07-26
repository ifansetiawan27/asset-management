import { Controller, Get } from '@nestjs/common';

import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { Tenant } from './tenant.entity';
import { TenantsService } from './tenants.service';

/** Operasi platform-level (bukan tenant-scoped) — hanya SUPER_ADMIN. */
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Roles(SystemRole.SUPER_ADMIN)
  @Get()
  findAll(): Promise<Tenant[]> {
    return this.service.findAll();
  }
}
