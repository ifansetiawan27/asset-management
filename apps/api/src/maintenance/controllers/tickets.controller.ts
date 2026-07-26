import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadableFile } from '../../asset-catalog/services/file-storage.service';
import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { AssignTicketDto } from '../dto/assign-ticket.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { TicketsService } from '../services/tickets.service';

@Controller('maintenance/tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get()
  list(@Query('assetId') assetId?: string, @Query('status') status?: string) {
    return this.service.list(assetId, status);
  }

  /** Semua pengguna terautentikasi dapat melapor kerusakan (FR-M3-2). */
  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user?.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.TECHNICIAN)
  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post(':id/assign')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.assign(id, dto, user?.sub);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadableFile,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.uploadAttachment(id, file, user?.sub);
  }

  @Get(':id/attachments')
  listAttachments(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listAttachments(id);
  }
}
