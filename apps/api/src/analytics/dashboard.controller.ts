import { Controller, Get } from '@nestjs/common';

import { Roles } from '../shared/rbac/roles.decorator';
import { SystemRole } from '../shared/rbac/roles.enum';
import { DashboardService } from './dashboard.service';

const VIEW_ROLES = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ASSET_ADMINISTRATOR,
  SystemRole.DEPARTMENT_MANAGER,
  SystemRole.AUDITOR,
  SystemRole.PROCUREMENT,
  SystemRole.TECHNICIAN,
];

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Roles(...VIEW_ROLES)
  @Get('summary')
  summary() {
    return this.service.summary();
  }
}
