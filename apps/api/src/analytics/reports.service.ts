import { BadRequestException, Injectable } from '@nestjs/common';

import { TenantService } from '../shared/tenant/tenant.service';
import { ReportType } from './analytics.enums';

type ReportRow = Record<string, unknown>;

/** Generator laporan (FR-M7). Query tenant-scoped via RLS. */
@Injectable()
export class ReportsService {
  constructor(private readonly tenant: TenantService) {}

  generate(type: ReportType): Promise<ReportRow[]> {
    return this.tenant.withTenant((em) => {
      switch (type) {
        case ReportType.INVENTORY:
          return em.query(
            `SELECT asset_code, name, status, category_id, location_id, department_id,
                    purchase_price, book_value
             FROM asset WHERE deleted_at IS NULL ORDER BY asset_code`,
          );
        case ReportType.LOCATION:
          return em.query(
            `SELECT location_id, COUNT(*)::int AS count,
                    COALESCE(SUM(book_value), 0) AS total_book_value
             FROM asset WHERE deleted_at IS NULL GROUP BY location_id ORDER BY count DESC`,
          );
        case ReportType.ASSIGNMENT:
          return em.query(
            `SELECT asset_code, name, custodian_user_id, department_id, location_id
             FROM asset WHERE deleted_at IS NULL AND custodian_user_id IS NOT NULL
             ORDER BY asset_code`,
          );
        case ReportType.MAINTENANCE:
          return em.query(
            `SELECT asset_id, type, cost, performed_at
             FROM maintenance_history ORDER BY performed_at DESC`,
          );
        case ReportType.DEPRECIATION:
          return em.query(
            `SELECT asset_id, period_year, period_month, depreciation_amount, accumulated, book_value
             FROM depreciation_entry ORDER BY period_year DESC, period_month DESC`,
          );
        case ReportType.DISPOSAL:
          return em.query(
            `SELECT asset_id, reason, status, sale_value, disposed_at, created_at
             FROM disposal_request ORDER BY created_at DESC`,
          );
        default:
          throw new BadRequestException('Report type tidak valid');
      }
    });
  }
}
