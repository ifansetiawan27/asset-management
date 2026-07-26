import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateHandoverDto } from '../dto/create-handover.dto';
import { HandoversService } from '../services/handovers.service';

@Controller()
export class HandoversController {
  constructor(private readonly service: HandoversService) {}

  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ASSET_ADMINISTRATOR,
    SystemRole.EMPLOYEE,
    SystemRole.TECHNICIAN,
  )
  @Post('handovers')
  create(@Body() dto: CreateHandoverDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user?.sub);
  }

  @Get('assets/:id/handovers')
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.list(id);
  }
}
