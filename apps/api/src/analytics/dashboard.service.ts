import { Injectable } from '@nestjs/common';

import { TenantService } from '../shared/tenant/tenant.service';

export interface DashboardSummary {
  assetSummary: { total: number; byStatus: Record<string, number> };
  assetValue: { totalPurchase: number; totalBookValue: number; totalDepreciation: number };
  maintenance: {
    openTickets: number;
    completedTickets: number;
    dueToday: number;
    overdue: number;
  };
  audit: {
    totalSessions: number;
    inProgressSessions: number;
    byStatus: Record<string, number>;
  };
  generatedAt: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** KPI dashboard (FR-M6). Semua agregasi tenant-scoped via RLS. */
@Injectable()
export class DashboardService {
  constructor(private readonly tenant: TenantService) {}

  summary(): Promise<DashboardSummary> {
    return this.tenant.withTenant(async (em) => {
      const statusRows: Array<{ status: string; count: number }> = await em.query(
        `SELECT status, COUNT(*)::int AS count FROM asset WHERE deleted_at IS NULL GROUP BY status`,
      );
      const byStatus: Record<string, number> = {};
      let total = 0;
      for (const row of statusRows) {
        const count = Number(row.count);
        byStatus[row.status] = count;
        total += count;
      }

      const [value] = await em.query(
        `SELECT COALESCE(SUM(purchase_price), 0) AS purchase, COALESCE(SUM(book_value), 0) AS book
         FROM asset WHERE deleted_at IS NULL AND status <> 'DISPOSED'`,
      );
      const totalPurchase = Number(value.purchase);
      const totalBookValue = Number(value.book);

      const [tickets] = await em.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS'))::int AS open_tickets,
           COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_tickets
         FROM maintenance_ticket`,
      );
      const [schedule] = await em.query(
        `SELECT
           COUNT(*) FILTER (WHERE active AND next_due_date = CURRENT_DATE)::int AS due_today,
           COUNT(*) FILTER (WHERE active AND next_due_date < CURRENT_DATE)::int AS overdue
         FROM maintenance_schedule`,
      );

      const [session] = await em.query(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress
         FROM audit_session`,
      );
      const auditItemRows: Array<{ status: string; count: number }> = await em.query(
        `SELECT status, COUNT(*)::int AS count FROM audit_item GROUP BY status`,
      );
      const auditByStatus: Record<string, number> = {
        FOUND: 0,
        MISSING: 0,
        DAMAGED: 0,
        RELOCATED: 0,
      };
      for (const row of auditItemRows) {
        if (row.status in auditByStatus) {
          auditByStatus[row.status] = Number(row.count);
        }
      }

      return {
        assetSummary: { total, byStatus },
        assetValue: {
          totalPurchase,
          totalBookValue,
          totalDepreciation: round2(totalPurchase - totalBookValue),
        },
        maintenance: {
          openTickets: Number(tickets.open_tickets),
          completedTickets: Number(tickets.completed_tickets),
          dueToday: Number(schedule.due_today),
          overdue: Number(schedule.overdue),
        },
        audit: {
          totalSessions: Number(session.total),
          inProgressSessions: Number(session.in_progress),
          byStatus: auditByStatus,
        },
        generatedAt: new Date().toISOString(),
      };
    });
  }
}
