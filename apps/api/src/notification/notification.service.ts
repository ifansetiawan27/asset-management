import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { getTenantId } from '../shared/tenant/tenant-context';
import { TenantService } from '../shared/tenant/tenant.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationChannel, NotificationStatus } from './notification.enums';

/** Render placeholder sederhana: {{key}} -> payload[key]. */
export function renderTemplate(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    data[key] === undefined || data[key] === null ? '' : String(data[key]),
  );
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly tenant: TenantService) {}

  send(dto: SendNotificationDto): Promise<Notification> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const payload = dto.payload ?? {};

      let subject = dto.subject ?? null;
      let body = dto.body;

      if (dto.templateCode) {
        const tpl = await em.findOne(NotificationTemplate, {
          where: { code: dto.templateCode, channel: dto.channel },
        });
        if (tpl) {
          subject = tpl.subject ? renderTemplate(tpl.subject, payload) : subject;
          body = renderTemplate(tpl.body, payload);
        }
      }

      let notification = em.create(Notification, {
        tenantId,
        userId: dto.userId ?? null,
        channel: dto.channel,
        templateCode: dto.templateCode ?? null,
        subject,
        body,
        payload,
        status: NotificationStatus.PENDING,
      });
      notification = await em.save(notification);

      try {
        this.dispatch(notification);
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
      } catch (err) {
        notification.status = NotificationStatus.FAILED;
        this.logger.error(`Gagal mengirim notifikasi ${notification.id}: ${String(err)}`);
      }
      return em.save(notification);
    });
  }

  listForUser(userId: string): Promise<Notification[]> {
    return this.tenant.withTenant((em) =>
      em
        .createQueryBuilder(Notification, 'n')
        .where('n.userId = :userId OR n.userId IS NULL', { userId })
        .orderBy('n.createdAt', 'DESC')
        .getMany(),
    );
  }

  markRead(id: string, userId: string): Promise<Notification> {
    return this.tenant.withTenant(async (em) => {
      const notification = await em.findOne(Notification, { where: { id } });
      if (!notification) {
        throw new NotFoundException('Notifikasi tidak ditemukan');
      }
      if (notification.userId !== null && notification.userId !== userId) {
        throw new ForbiddenException('Bukan notifikasi Anda');
      }
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      return em.save(notification);
    });
  }

  listTemplates(): Promise<NotificationTemplate[]> {
    return this.tenant.withTenant((em) =>
      em.find(NotificationTemplate, { order: { code: 'ASC' } }),
    );
  }

  createTemplate(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    return this.tenant.withTenant((em) => {
      const template = em.create(NotificationTemplate, {
        tenantId: getTenantId() as string,
        code: dto.code,
        channel: dto.channel,
        locale: dto.locale ?? 'id',
        subject: dto.subject ?? null,
        body: dto.body,
      });
      return em.save(template);
    });
  }

  /** Dispatcher kanal. EMAIL/WA masih stub (log) untuk dev; IN_APP cukup tersimpan. */
  private dispatch(notification: Notification): void {
    switch (notification.channel) {
      case NotificationChannel.IN_APP:
        break;
      case NotificationChannel.EMAIL:
        this.logger.log(`[EMAIL stub] to=${notification.userId ?? 'broadcast'} subject="${notification.subject}"`);
        break;
      case NotificationChannel.WHATSAPP:
        this.logger.log(`[WA stub] to=${notification.userId ?? 'broadcast'} body="${notification.body.slice(0, 60)}"`);
        break;
      default:
        break;
    }
  }
}
