import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Permintaan disposal aset (FR-M5-1/2). */
@Entity('disposal_request')
@Index('idx_disposal_tenant_asset', ['tenantId', 'assetId'])
@Index('idx_disposal_tenant_status', ['tenantId', 'status'])
export class DisposalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ length: 20 })
  reason: string;

  @Column({ length: 20, default: 'UNDER_REVIEW' })
  status: string;

  @Column({
    name: 'sale_value',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  saleValue: number | null;

  @Column({ name: 'requested_by', type: 'uuid', nullable: true })
  requestedBy: string | null;

  @Column({ name: 'approval_request_id', type: 'uuid', nullable: true })
  approvalRequestId: string | null;

  @Column({ name: 'disposed_at', type: 'timestamptz', nullable: true })
  disposedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
