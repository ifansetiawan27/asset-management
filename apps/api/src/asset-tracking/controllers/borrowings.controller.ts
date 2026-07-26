import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';

import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateBorrowingDto } from '../dto/create-borrowing.dto';
import { ReturnBorrowingDto } from '../dto/return-borrowing.dto';
import { BorrowingsService } from '../services/borrowings.service';

@Controller('borrowings')
export class BorrowingsController {
  constructor(private readonly service: BorrowingsService) {}

  @Get()
  list(@Query('assetId') assetId?: string) {
    return this.service.list(assetId);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.EMPLOYEE)
  @Post()
  create(@Body() dto: CreateBorrowingDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user?.sub);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.EMPLOYEE)
  @Post(':id/return')
  returnAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnBorrowingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.returnAsset(id, dto, user?.sub);
  }
}
