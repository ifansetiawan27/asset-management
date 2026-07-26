import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Dokumen disposal: berita acara, foto, approval, dll (FR-M5-3). */
@Entity('disposal_document')
@Index('idx_disposal_document_request', ['tenantId', 'disposalRequestId'])
export class DisposalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'disposal_request_id', type: 'uuid' })
  disposalRequestId: string;

  @Column({ name: 'doc_type', length: 20 })
  docType: string;

  @Column({ name: 'file_key', type: 'text' })
  fileKey: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
