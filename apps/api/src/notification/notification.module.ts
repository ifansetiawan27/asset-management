import { Module } from '@nestjs/common';

import { NotificationController } from './notification.controller';
import { NotificationReminderService } from './notification-reminder.service';
import { NotificationService } from './notification.service';
import { NotificationTemplateController } from './notification-template.controller';

/** Modul Notification: in-app/email/WA (stub) + reminder maintenance lintas-tenant. */
@Module({
  controllers: [NotificationController, NotificationTemplateController],
  providers: [NotificationService, NotificationReminderService],
})
export class NotificationModule {}
