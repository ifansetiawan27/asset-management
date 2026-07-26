import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { RunDepreciationDto } from '../dto/run-depreciation.dto';
import { DepreciationService } from './depreciation.service';

@Controller()
export class DepreciationController {
  constructor(private readonly service: DepreciationService) {}

  /** Jalankan batch penyusutan untuk satu periode (FR-M4-1). */
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post('depreciation/run')
  run(@Body() dto: RunDepreciationDto) {
    return this.service.runBatch(dto.year, dto.month);
  }

  @Get('assets/:id/depreciation')
  byAsset(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listByAsset(id);
  }
}
