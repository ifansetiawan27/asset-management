import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Module 6 & 7 — Dashboard & Reporting (read-only, agregasi lintas modul via RLS).
 */
@Module({
  controllers: [DashboardController, ReportsController],
  providers: [DashboardService, ReportsService],
})
export class AnalyticsModule {}
