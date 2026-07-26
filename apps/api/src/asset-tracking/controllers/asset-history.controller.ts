import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { AssetHistoryService } from '../services/asset-history.service';

@Controller()
export class AssetHistoryController {
  constructor(private readonly history: AssetHistoryService) {}

  @Get('assets/:id/history')
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.history.list(id);
  }
}
