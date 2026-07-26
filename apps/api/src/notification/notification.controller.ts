import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { AuthUser } from '../identity/auth-user.interface';
import { CurrentUser } from '../identity/current-user.decorator';
import { Roles } from '../shared/rbac/roles.decorator';
import { SystemRole } from '../shared/rbac/roles.enum';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationReminderService } from './notification-reminder.service';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly service: NotificationService,
    private readonly reminder: NotificationReminderService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listForUser(user?.sub);
  }

  @Post(':id/read')
  read(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.markRead(id, user?.sub);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post()
  send(@Body() dto: SendNotificationDto) {
    return this.service.send(dto);
  }

  /** Pemicu manual reminder maintenance lintas-tenant (juga berjalan via cron harian). */
  @Roles(SystemRole.SUPER_ADMIN)
  @Post('run-reminders')
  runReminders() {
    return this.reminder.runAll();
  }
}
