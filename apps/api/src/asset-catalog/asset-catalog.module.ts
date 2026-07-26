import { Module } from '@nestjs/common';

import { AssetsController } from './controllers/assets.controller';
import { CategoriesController } from './controllers/categories.controller';
import { VendorsController } from './controllers/vendors.controller';
import { AssetCodeService } from './services/asset-code.service';
import { AssetDocumentService } from './services/asset-document.service';
import { AssetsService } from './services/assets.service';
import { CategoriesService } from './services/categories.service';
import { FileStorageService } from './services/file-storage.service';
import { QrService } from './services/qr.service';
import { VendorsService } from './services/vendors.service';

/**
 * Module 1 — Procurement & Onboarding (Asset Catalog).
 * Service memakai TenantService.withTenant (RLS-aware), sehingga tidak perlu
 * TypeOrmModule.forFeature untuk repository injeksi.
 */
@Module({
  controllers: [AssetsController, CategoriesController, VendorsController],
  providers: [
    AssetsService,
    CategoriesService,
    VendorsService,
    AssetDocumentService,
    AssetCodeService,
    QrService,
    FileStorageService,
  ],
  exports: [AssetsService],
})
export class AssetCatalogModule {}
