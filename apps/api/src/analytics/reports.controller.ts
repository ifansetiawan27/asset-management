import { BadRequestException, Controller, Get, Header, Param } from '@nestjs/common';

import { Roles } from '../shared/rbac/roles.decorator';
import { SystemRole } from '../shared/rbac/roles.enum';
import { ReportType } from './analytics.enums';
import { toCsv } from './csv.util';
import { ReportsService } from './reports.service';

const VIEW_ROLES = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ASSET_ADMINISTRATOR,
  SystemRole.DEPARTMENT_MANAGER,
  SystemRole.AUDITOR,
  SystemRole.PROCUREMENT,
  SystemRole.TECHNICIAN,
];

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Roles(...VIEW_ROLES)
  @Get(':type')
  async report(@Param('type') type: string) {
    const reportType = this.parseType(type);
    const rows = await this.service.generate(reportType);
    return {
      type: reportType,
      generatedAt: new Date().toISOString(),
      count: rows.length,
      rows,
    };
  }

  @Roles(...VIEW_ROLES)
  @Get(':type/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="report.csv"')
  async export(@Param('type') type: string): Promise<string> {
    const reportType = this.parseType(type);
    const rows = await this.service.generate(reportType);
    return toCsv(rows);
  }

  private parseType(type: string): ReportType {
    const upper = (type ?? '').toUpperCase();
    if (!(Object.values(ReportType) as string[]).includes(upper)) {
      throw new BadRequestException('Report type tidak valid');
    }
    return upper as ReportType;
  }
}
