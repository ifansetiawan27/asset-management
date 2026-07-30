import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  /** Daftar semua pengguna pada tenant (semua peran dapat mengakses). */
  @Get()
  findAll(): Promise<User[]> {
    return this.service.findAll();
  }

  /**
   * Undang pengguna baru dengan peran yang dipilih.
   * Hanya SUPER_ADMIN.
   */
  @Post('invite')
  @Roles(SystemRole.SUPER_ADMIN)
  invite(@Body() dto: InviteUserDto): Promise<User> {
    return this.service.invite(dto);
  }

  /**
   * Ubah peran pengguna.
   * Hanya SUPER_ADMIN.
   */
  @Patch(':id/role')
  @Roles(SystemRole.SUPER_ADMIN)
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<User> {
    return this.service.updateRole(id, dto);
  }

  /**
   * Hapus pengguna.
   * Hanya SUPER_ADMIN. Tidak dapat menghapus diri sendiri.
   */
  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN)
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.service.remove(id, user.sub);
  }
}
