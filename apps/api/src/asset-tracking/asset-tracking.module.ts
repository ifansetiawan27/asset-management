import { Module } from '@nestjs/common';

import { ApprovalsController } from './approval/approvals.controller';
import { ApprovalsService } from './approval/approvals.service';
import { AssetHistoryController } from './controllers/asset-history.controller';
import { AssignmentsController } from './controllers/assignments.controller';
import { BorrowingsController } from './controllers/borrowings.controller';
import { HandoversController } from './controllers/handovers.controller';
import { TransfersController } from './controllers/transfers.controller';
import { AssetHistoryService } from './services/asset-history.service';
import { AssignmentsService } from './services/assignments.service';
import { BorrowingsService } from './services/borrowings.service';
import { HandoversService } from './services/handovers.service';
import { TransfersService } from './services/transfers.service';

/**
 * Module 2 — Tracking & Assignment.
 * Service RLS-aware via TenantService.withTenant (tanpa forFeature).
 */
@Module({
  controllers: [
    AssignmentsController,
    TransfersController,
    BorrowingsController,
    HandoversController,
    AssetHistoryController,
    ApprovalsController,
  ],
  providers: [
    AssetHistoryService,
    AssignmentsService,
    TransfersService,
    BorrowingsService,
    HandoversService,
    ApprovalsService,
  ],
})
export class AssetTrackingModule {}
