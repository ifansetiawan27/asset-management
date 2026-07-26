import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { AddPartDto } from '../dto/add-part.dto';
import { CompleteWorkOrderDto } from '../dto/complete-work-order.dto';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { WorkOrdersService } from '../services/work-orders.service';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Get()
  list(@Query('assetId') assetId?: string, @Query('ticketId') ticketId?: string) {
    return this.service.list(assetId, ticketId);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.TECHNICIAN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.update(id, dto);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.TECHNICIAN)
  @Post(':id/parts')
  addPart(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddPartDto) {
    return this.service.addPart(id, dto);
  }

  @Get(':id/parts')
  listParts(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listParts(id);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.TECHNICIAN)
  @Post(':id/start')
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.start(id);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.TECHNICIAN)
  @Post(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CompleteWorkOrderDto) {
    return this.service.complete(id, dto);
  }
}
