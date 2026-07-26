import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { QueryAssetDto } from '../dto/query-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { AssetCategory } from '../entities/asset-category.entity';
import { Asset } from '../entities/asset.entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { AssetCodeService } from './asset-code.service';
import { QrService } from './qr.service';

function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return input.replace(/[&<>"']/g, (ch) => map[ch]);
}

export interface PaginatedAssets {
  data: Asset[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly tenant: TenantService,
    private readonly assetCode: AssetCodeService,
    private readonly qr: QrService,
  ) {}

  create(dto: CreateAssetDto, userId?: string): Promise<Asset> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;

      const category = await em.findOne(AssetCategory, { where: { id: dto.categoryId } });
      if (!category) {
        throw new BadRequestException('categoryId tidak valid untuk tenant ini');
      }

      const code = await this.assetCode.next(em, tenantId, category.code);
      const asset = em.create(Asset, {
        tenantId,
        assetCode: code,
        name: dto.name,
        categoryId: dto.categoryId,
        brand: dto.brand ?? null,
        model: dto.model ?? null,
        serialNumber: dto.serialNumber ?? null,
        assetType: dto.assetType ?? null,
        purchaseDate: dto.purchaseDate ?? null,
        purchasePrice: dto.purchasePrice ?? null,
        salvageValue: dto.salvageValue ?? 0,
        currency: dto.currency ?? 'IDR',
        vendorId: dto.vendorId ?? null,
        warrantyExpiry: dto.warrantyExpiry ?? null,
        usefulLifeYears: dto.usefulLifeYears ?? category.defaultUsefulLifeYears ?? null,
        depreciationMethod:
          dto.depreciationMethod ?? category.defaultDepreciationMethod ?? 'STRAIGHT_LINE',
        bookValue: dto.purchasePrice ?? null,
        locationId: dto.locationId ?? null,
        departmentId: dto.departmentId ?? null,
        custodianUserId: dto.custodianUserId ?? null,
        status: AssetStatus.DRAFT,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      });

      const saved = await em.save(asset);
      saved.qrUrl = await this.qr.generateDataUrl(tenantId, saved.id, code);
      return em.save(saved);
    });
  }

  findAll(query: QueryAssetDto): Promise<PaginatedAssets> {
    return this.tenant.withTenant(async (em) => {
      const qb = em.createQueryBuilder(Asset, 'a');
      if (query.status) {
        qb.andWhere('a.status = :status', { status: query.status });
      }
      if (query.categoryId) {
        qb.andWhere('a.categoryId = :categoryId', { categoryId: query.categoryId });
      }
      if (query.q) {
        qb.andWhere(
          '(a.name ILIKE :q OR a.assetCode ILIKE :q OR a.serialNumber ILIKE :q)',
          { q: `%${query.q}%` },
        );
      }
      qb.orderBy('a.createdAt', 'DESC')
        .skip((query.page - 1) * query.limit)
        .take(query.limit);

      const [data, total] = await qb.getManyAndCount();
      return {
        data,
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit) || 0,
        },
      };
    });
  }

  findOne(id: string): Promise<Asset> {
    return this.tenant.withTenant((em) => this.getOrFail(em, id));
  }

  update(id: string, dto: UpdateAssetDto, userId?: string): Promise<Asset> {
    return this.tenant.withTenant(async (em) => {
      const asset = await this.getOrFail(em, id);
      Object.assign(asset, dto);
      if (userId) {
        asset.updatedBy = userId;
      }
      return em.save(asset);
    });
  }

  remove(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.tenant.withTenant(async (em) => {
      const asset = await this.getOrFail(em, id);
      await em.softRemove(asset);
      return { id, deleted: true };
    });
  }

  regenerateLabel(
    id: string,
  ): Promise<{ id: string; assetCode: string; qrUrl: string | null }> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await this.getOrFail(em, id);
      asset.qrUrl = await this.qr.generateDataUrl(tenantId, asset.id, asset.assetCode);
      await em.save(asset);
      return { id: asset.id, assetCode: asset.assetCode, qrUrl: asset.qrUrl };
    });
  }

  renderLabelHtml(id: string): Promise<string> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await this.getOrFail(em, id);
      const qr =
        asset.qrUrl ?? (await this.qr.generateDataUrl(tenantId, asset.id, asset.assetCode));
      return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Label ${asset.assetCode}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;display:flex;justify-content:center;padding:24px}
  .label{width:280px;border:1px solid #000;border-radius:8px;padding:16px;text-align:center}
  .code{font-weight:bold;font-size:16px;margin-top:8px;letter-spacing:.5px}
  .name{font-size:12px;color:#333;margin-top:4px}
</style></head>
<body><div class="label">
  <img src="${qr}" width="180" height="180" alt="QR ${asset.assetCode}"/>
  <div class="code">${escapeHtml(asset.assetCode)}</div>
  <div class="name">${escapeHtml(asset.name)}</div>
</div></body></html>`;
    });
  }

  private async getOrFail(em: EntityManager, id: string): Promise<Asset> {
    const asset = await em.findOne(Asset, { where: { id } });
    if (!asset) {
      throw new NotFoundException('Asset tidak ditemukan');
    }
    return asset;
  }
}
