import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { AssetDocument } from '../entities/asset-document.entity';
import { Asset } from '../entities/asset.entity';
import { DocumentType } from '../enums/document-type.enum';
import { FileStorageService, UploadableFile } from './file-storage.service';

@Injectable()
export class AssetDocumentService {
  constructor(
    private readonly tenant: TenantService,
    private readonly storage: FileStorageService,
  ) {}

  list(assetId: string): Promise<AssetDocument[]> {
    return this.tenant.withTenant((em) =>
      em.find(AssetDocument, { where: { assetId }, order: { createdAt: 'DESC' } }),
    );
  }

  upload(
    assetId: string,
    file: UploadableFile | undefined,
    docType: DocumentType,
    userId?: string,
  ): Promise<AssetDocument> {
    if (!file) {
      throw new BadRequestException('File wajib diunggah (field form-data: "file")');
    }
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;

      const asset = await em.findOne(Asset, { where: { id: assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }

      const fileKey = await this.storage.save(tenantId, assetId, file);
      const doc = em.create(AssetDocument, {
        tenantId,
        assetId,
        docType,
        fileKey,
        fileName: file.originalname,
        mime: file.mimetype,
        size: file.size,
        uploadedBy: userId ?? null,
      });
      return em.save(doc);
    });
  }
}
