import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { TenantService } from '../shared/tenant/tenant.service';
import { Notification } from './entities/notification.entity';
import { NotificationChannel, NotificationStatus } from './notification.enums';

interface DueSchedule {
  id: string;
  asset_id: string;
  next_due_date: string;
}

/**
 * Reminder maintenance jatuh tempo — berjalan lintas-tenant.
 * Membaca daftar tenant (tabel tenant tanpa RLS) lalu memproses per tenant
 * dalam konteks RLS masing-masing.
 */
@Injectable()
export class NotificationReminderService {
  private readonly logger = new Logger(NotificationReminderService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenant: TenantService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduledRun(): Promise<void> {
    const result = await this.runAll();
    this.logger.log(
      `Reminder maintenance: ${result.notificationsCreated} notifikasi untuk ${result.tenants} tenant`,
    );
  }

  async runAll(): Promise<{ tenants: number; notificationsCreated: number }> {
    const tenants: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id FROM tenant WHERE status = 'active'`,
    );
    let created = 0;
    for (const t of tenants) {
      created += await this.runForTenant(t.id);
    }
    return { tenants: tenants.length, notificationsCreated: created };
  }

  private runForTenant(tenantId: string): Promise<number> {
    return this.tenant.withTenant(async (em) => {
      const today = new Date().toISOString().slice(0, 10);
      const due: DueSchedule[] = await em.query(
        `SELECT id, asset_id, next_due_date FROM maintenance_schedule
         WHERE active AND next_due_date <= $1`,
        [today],
      );
      for (const schedule of due) {
        const notification = em.create(Notification, {
          tenantId,
          userId: null,
          channel: NotificationChannel.IN_APP,
          templateCode: 'MAINTENANCE_DUE',
          subject: 'Maintenance jatuh tempo',
          body: `Aset ${schedule.asset_id} jatuh tempo maintenance pada ${schedule.next_due_date}`,
          payload: {
            assetId: schedule.asset_id,
            scheduleId: schedule.id,
            dueDate: schedule.next_due_date,
          },
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        });
        await em.save(notification);
      }
      return due.length;
    }, tenantId);
  }
}
