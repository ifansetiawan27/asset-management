import { Module } from '@nestjs/common';

import { FileStorageService } from '../asset-catalog/services/file-storage.service';
import { DisposalController } from './controllers/disposal.controller';
import { DisposalDocumentService } from './services/disposal-document.service';
import { DisposalService } from './services/disposal.service';

/**
 * Module 5 — Disposal & Retirement.
 * Menggunakan ApprovalRequest (Approval Engine) untuk persetujuan; finalisasi
 * membaca status approval lalu men-DISPOSED / mengembalikan aset.
 */
@Module({
  controllers: [DisposalController],
  providers: [DisposalService, DisposalDocumentService, FileStorageService],
})
export class DisposalModule {}
