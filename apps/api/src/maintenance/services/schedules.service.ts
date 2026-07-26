import { Injectable, NotFoundException } from '@nestjs/common';
import { LessThanOrEqual } from 'typeorm';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { MaintenanceSchedule } from '../entities/maintenance-schedule.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { MaintenanceFrequency, MaintenanceType, WorkOrderStatus } from '../maintenance.enums';

function shiftMonths(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeNextDue(current: string, frequency: string, intervalDays: number | null): string {
  switch (frequency) {
    case MaintenanceFrequency.MONTHLY:
      return shiftMonths(current, 1);
    case MaintenanceFrequency.QUARTERLY:
      return shiftMonths(current, 3);
    case MaintenanceFrequency.SEMESTER:
      return shiftMonths(current, 6);
    case MaintenanceFrequency.ANNUAL:
      return shiftMonths(current, 12);
    case MaintenanceFrequency.CUSTOM:
      return shiftDays(current, intervalDays ?? 30);
    default:
      return shiftMonths(current, 1);
  }
}

@Injectable()
export class SchedulesService {
  constructor(private readonly tenant: TenantService) {}

  create(dto: CreateScheduleDto): Promise<MaintenanceSchedule> {
    return this.tenant.withTenant((em) => {
      const entity = em.create(MaintenanceSchedule, {
        tenantId: getTenantId() as string,
        assetId: dto.assetId,
        frequency: dto.frequency,
        intervalDays: dto.intervalDays ?? null,
        nextDueDate: dto.nextDueDate,
        active: true,
      });
      return em.save(entity);
    });
  }

  list(assetId?: string): Promise<MaintenanceSchedule[]> {
    return this.tenant.withTenant((em) =>
      em.find(MaintenanceSchedule, {
        where: assetId ? { assetId } : {},
        order: { nextDueDate: 'ASC' },
      }),
    );
  }

  update(id: string, dto: UpdateScheduleDto): Promise<MaintenanceSchedule> {
    return this.tenant.withTenant(async (em) => {
      const schedule = await em.findOne(MaintenanceSchedule, { where: { id } });
      if (!schedule) {
        throw new NotFoundException('Schedule tidak ditemukan');
      }
      Object.assign(schedule, dto);
      return em.save(schedule);
    });
  }

  remove(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.tenant.withTenant(async (em) => {
      const schedule = await em.findOne(MaintenanceSchedule, { where: { id } });
      if (!schedule) {
        throw new NotFoundException('Schedule tidak ditemukan');
      }
      await em.remove(schedule);
      return { id, deleted: true };
    });
  }

  /**
   * Menjalankan jadwal yang jatuh tempo (pengganti cron per-tenant, FR-M3-1):
   * membuat Work Order preventive + memajukan next_due_date.
   */
  runDue(): Promise<{ processed: number; workOrders: WorkOrder[] }> {
    return this.tenant.withTenant(async (em) => {
      const today = new Date().toISOString().slice(0, 10);
      const due = await em.find(MaintenanceSchedule, {
        where: { active: true, nextDueDate: LessThanOrEqual(today) },
      });

      const workOrders: WorkOrder[] = [];
      for (const schedule of due) {
        const wo = em.create(WorkOrder, {
          tenantId: getTenantId() as string,
          assetId: schedule.assetId,
          maintenanceType: MaintenanceType.PREVENTIVE,
          complaint: `Preventive maintenance (${schedule.frequency})`,
          status: WorkOrderStatus.OPEN,
        });
        workOrders.push(await em.save(wo));

        schedule.lastDoneDate = schedule.nextDueDate;
        schedule.nextDueDate = computeNextDue(
          schedule.nextDueDate,
          schedule.frequency,
          schedule.intervalDays,
        );
        await em.save(schedule);
      }

      return { processed: due.length, workOrders };
    });
  }
}
