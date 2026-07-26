import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { SchedulesService } from '../services/schedules.service';

@Controller('maintenance/schedules')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Get()
  list(@Query('assetId') assetId?: string) {
    return this.service.list(assetId);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.service.create(dto);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScheduleDto) {
    return this.service.update(id, dto);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  /** Jalankan jadwal jatuh tempo untuk tenant aktif (FR-M3-1). */
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post('run-due')
  runDue() {
    return this.service.runDue();
  }
}
