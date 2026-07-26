import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { ApprovalDecisionDto } from './approval-decision.dto';
import { ApprovalDecision } from './approval.enums';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.DEPARTMENT_MANAGER)
  @Get('inbox')
  inbox() {
    return this.service.listInbox();
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.DEPARTMENT_MANAGER)
  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDecisionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.decide(id, ApprovalDecision.APPROVE, dto.note, user?.sub);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.DEPARTMENT_MANAGER)
  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDecisionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.decide(id, ApprovalDecision.REJECT, dto.note, user?.sub);
  }
}
