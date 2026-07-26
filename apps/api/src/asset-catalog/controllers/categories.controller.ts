import { Body, Controller, Get, Post } from '@nestjs/common';

import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { AssetCategory } from '../entities/asset-category.entity';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll(): Promise<AssetCategory[]> {
    return this.service.findAll();
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<AssetCategory> {
    return this.service.create(dto);
  }
}
