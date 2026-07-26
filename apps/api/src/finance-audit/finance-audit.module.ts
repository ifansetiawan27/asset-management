import { Module } from '@nestjs/common';

import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { DepreciationController } from './depreciation/depreciation.controller';
import { DepreciationService } from './depreciation/depreciation.service';

/** Module 4 — Depreciation & Audit. */
@Module({
  controllers: [DepreciationController, AuditController],
  providers: [DepreciationService, AuditService],
})
export class FinanceAuditModule {}
