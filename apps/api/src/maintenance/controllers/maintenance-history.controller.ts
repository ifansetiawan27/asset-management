import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { MaintenanceHistoryService } from '../services/maintenance-history.service';

@Controller()
export class MaintenanceHistoryController {
  constructor(private readonly service: MaintenanceHistoryService) {}

  @Get('assets/:id/maintenance-history')
  byAsset(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.list(id);
  }

  @Get('maintenance/history')
  list(@Query('assetId') assetId?: string) {
    return this.service.list(assetId);
  }
}
