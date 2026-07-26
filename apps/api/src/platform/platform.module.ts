import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../shared/rbac/roles.guard';
import { Permission } from './role/permission.entity';
import { Role } from './role/role.entity';
import { Tenant } from './tenant/tenant.entity';
import { TenantsController } from './tenant/tenants.controller';
import { TenantsService } from './tenant/tenants.service';
import { User } from './user/user.entity';
import { UsersController } from './user/users.controller';
import { UsersService } from './user/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User, Role, Permission])],
  controllers: [TenantsController, UsersController],
  providers: [TenantsService, UsersService, RolesGuard],
  exports: [TenantsService, UsersService],
})
export class PlatformModule {}
