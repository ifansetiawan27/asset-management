import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Riwayat maintenance (FR-M3-4) — dicatat saat work order selesai. */
@Entity('maintenance_history')
@Index('idx_maint_history_tenant_asset', ['tenantId', 'assetId'])
export class MaintenanceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'work_order_id', type: 'uuid', nullable: true })
  workOrderId: string | null;

  @Column({ name: 'technician_user_id', type: 'uuid', nullable: true })
  technicianUserId: string | null;

  @Column({ name: 'performed_at', type: 'timestamptz', default: () => 'now()' })
  performedAt: Date;

  @Column({ length: 20 })
  type: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  parts: Array<Record<string, unknown>>;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  cost: number | null;

  @Column({ name: 'attachment_keys', type: 'jsonb', default: () => "'[]'::jsonb" })
  attachmentKeys: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
