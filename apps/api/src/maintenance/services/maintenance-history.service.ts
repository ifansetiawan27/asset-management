import { Injectable } from '@nestjs/common';

import { TenantService } from '../../shared/tenant/tenant.service';
import { MaintenanceHistory } from '../entities/maintenance-history.entity';

@Injectable()
export class MaintenanceHistoryService {
  constructor(private readonly tenant: TenantService) {}

  list(assetId?: string): Promise<MaintenanceHistory[]> {
    return this.tenant.withTenant((em) =>
      em.find(MaintenanceHistory, {
        where: assetId ? { assetId } : {},
        order: { performedAt: 'DESC' },
      }),
    );
  }
}
