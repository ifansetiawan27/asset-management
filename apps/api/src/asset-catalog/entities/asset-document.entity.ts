import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Dokumen aset (FR-M1-2): invoice, PO, warranty, manual, foto, dll. */
@Entity('asset_document')
@Index('idx_asset_document_asset', ['tenantId', 'assetId'])
export class AssetDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'doc_type', length: 20 })
  docType: string;

  @Column({ name: 'file_key', type: 'text' })
  fileKey: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime: string | null;

  @Column({ type: 'bigint', nullable: true, transformer: numericTransformer })
  size: number | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
