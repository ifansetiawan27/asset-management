import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { FileStorageService, UploadableFile } from '../../asset-catalog/services/file-storage.service';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { DisposalDocType } from '../disposal.enums';
import { DisposalDocument } from '../entities/disposal-document.entity';
import { DisposalRequest } from '../entities/disposal-request.entity';

@Injectable()
export class DisposalDocumentService {
  constructor(
    private readonly tenant: TenantService,
    private readonly storage: FileStorageService,
  ) {}

  upload(
    disposalId: string,
    file: UploadableFile | undefined,
    docType: DisposalDocType,
  ): Promise<DisposalDocument> {
    if (!file) {
      throw new BadRequestException('File wajib diunggah (field form-data: "file")');
    }
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const disposal = await em.findOne(DisposalRequest, { where: { id: disposalId } });
      if (!disposal) {
        throw new NotFoundException('Disposal tidak ditemukan');
      }
      const fileKey = await this.storage.save(tenantId, disposalId, file);
      const doc = em.create(DisposalDocument, {
        tenantId,
        disposalRequestId: disposalId,
        docType,
        fileKey,
        fileName: file.originalname,
        mime: file.mimetype,
      });
      return em.save(doc);
    });
  }

  list(disposalId: string): Promise<DisposalDocument[]> {
    return this.tenant.withTenant((em) =>
      em.find(DisposalDocument, {
        where: { disposalRequestId: disposalId },
        order: { createdAt: 'DESC' },
      }),
    );
  }
}
