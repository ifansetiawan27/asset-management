import { Body, Controller, Get, Post } from '@nestjs/common';

import { Roles } from '../shared/rbac/roles.decorator';
import { SystemRole } from '../shared/rbac/roles.enum';
import { CreateTemplateDto } from './dto/create-template.dto';
import { NotificationService } from './notification.service';

@Controller('notification-templates')
export class NotificationTemplateController {
  constructor(private readonly service: NotificationService) {}

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Get()
  list() {
    return this.service.listTemplates();
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }
}
