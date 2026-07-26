import { Injectable } from '@nestjs/common';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { Vendor } from '../entities/vendor.entity';

@Injectable()
export class VendorsService {
  constructor(private readonly tenant: TenantService) {}

  findAll(): Promise<Vendor[]> {
    return this.tenant.withTenant((em) => em.find(Vendor, { order: { code: 'ASC' } }));
  }

  create(dto: CreateVendorDto): Promise<Vendor> {
    return this.tenant.withTenant((em) => {
      const entity = em.create(Vendor, {
        tenantId: getTenantId() as string,
        code: dto.code,
        name: dto.name,
        contact: dto.contact ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
      });
      return em.save(entity);
    });
  }
}
