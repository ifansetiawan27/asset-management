import { Module } from '@nestjs/common';

import { FileStorageService } from '../asset-catalog/services/file-storage.service';
import { MaintenanceHistoryController } from './controllers/maintenance-history.controller';
import { SchedulesController } from './controllers/schedules.controller';
import { TicketsController } from './controllers/tickets.controller';
import { WorkOrdersController } from './controllers/work-orders.controller';
import { MaintenanceHistoryService } from './services/maintenance-history.service';
import { SchedulesService } from './services/schedules.service';
import { TicketsService } from './services/tickets.service';
import { WorkOrdersService } from './services/work-orders.service';

/**
 * Module 3 — Maintenance & Inspection.
 * FileStorageService di-provide ulang (stateless) untuk upload lampiran tiket.
 */
@Module({
  controllers: [
    SchedulesController,
    TicketsController,
    WorkOrdersController,
    MaintenanceHistoryController,
  ],
  providers: [
    SchedulesService,
    TicketsService,
    WorkOrdersService,
    MaintenanceHistoryService,
    FileStorageService,
  ],
})
export class MaintenanceModule {}
