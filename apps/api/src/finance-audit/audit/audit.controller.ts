import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';

import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateAuditSessionDto } from '../dto/create-audit-session.dto';
import { SubmitAuditItemDto } from '../dto/submit-audit-item.dto';
import { SyncAuditDto } from '../dto/sync-audit.dto';
import { AuditService } from './audit.service';

const AUDIT_ROLES = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ASSET_ADMINISTRATOR,
  SystemRole.AUDITOR,
];

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  /** Lookup aset via kode QR untuk alur scan (FR-M4-2). */
  @Get('lookup')
  lookup(@Query('code') code?: string) {
    return this.service.lookupByCode(code);
  }

  @Roles(...AUDIT_ROLES)
  @Post('sessions')
  createSession(@Body() dto: CreateAuditSessionDto) {
    return this.service.createSession(dto);
  }

  @Get('sessions')
  listSessions() {
    return this.service.listSessions();
  }

  @Get('sessions/:id')
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSession(id);
  }

  @Roles(...AUDIT_ROLES)
  @Post('sessions/:id/start')
  start(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.startSession(id, user?.sub);
  }

  @Roles(...AUDIT_ROLES)
  @Post('sessions/:id/close')
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.closeSession(id);
  }

  @Roles(...AUDIT_ROLES)
  @Post('sessions/:id/items')
  submitItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAuditItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submitItem(id, dto, user?.sub);
  }

  @Roles(...AUDIT_ROLES)
  @Post('sessions/:id/sync')
  sync(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncAuditDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.syncBatch(id, dto.items, user?.sub);
  }

  @Get('sessions/:id/report')
  report(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.report(id);
  }
}
