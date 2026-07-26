import { Injectable } from '@nestjs/common';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { AssetCategory } from '../entities/asset-category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly tenant: TenantService) {}

  findAll(): Promise<AssetCategory[]> {
    return this.tenant.withTenant((em) =>
      em.find(AssetCategory, { order: { code: 'ASC' } }),
    );
  }

  create(dto: CreateCategoryDto): Promise<AssetCategory> {
    return this.tenant.withTenant((em) => {
      const entity = em.create(AssetCategory, {
        tenantId: getTenantId() as string,
        code: dto.code,
        name: dto.name,
        defaultUsefulLifeYears: dto.defaultUsefulLifeYears ?? null,
        defaultDepreciationMethod: dto.defaultDepreciationMethod ?? 'STRAIGHT_LINE',
      });
      return em.save(entity);
    });
  }
}
