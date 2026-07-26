import { Body, Controller, Get, Post } from '@nestjs/common';

import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { Vendor } from '../entities/vendor.entity';
import { VendorsService } from '../services/vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @Get()
  findAll(): Promise<Vendor[]> {
    return this.service.findAll();
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post()
  create(@Body() dto: CreateVendorDto): Promise<Vendor> {
    return this.service.create(dto);
  }
}
