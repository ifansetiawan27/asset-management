import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Mutasi/transfer aset dengan workflow approval (FR-M2-2). */
@Entity('asset_transfer')
@Index('idx_transfer_tenant_asset', ['tenantId', 'assetId'])
export class AssetTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'from_location_id', type: 'uuid', nullable: true })
  fromLocationId: string | null;

  @Column({ name: 'to_location_id', type: 'uuid', nullable: true })
  toLocationId: string | null;

  @Column({ name: 'from_department_id', type: 'uuid', nullable: true })
  fromDepartmentId: string | null;

  @Column({ name: 'to_department_id', type: 'uuid', nullable: true })
  toDepartmentId: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ length: 20, default: 'REQUESTED' })
  status: string;

  @Column({ name: 'requested_by', type: 'uuid', nullable: true })
  requestedBy: string | null;

  @Column({ name: 'approval_request_id', type: 'uuid', nullable: true })
  approvalRequestId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
