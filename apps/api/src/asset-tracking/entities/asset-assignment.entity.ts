import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Assignment aset ke pegawai/divisi/lokasi (FR-M2-1). */
@Entity('asset_assignment')
@Index('idx_assignment_tenant_asset', ['tenantId', 'assetId'])
export class AssetAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'assignee_type', length: 20 })
  assigneeType: string;

  @Column({ name: 'assignee_id', type: 'uuid' })
  assigneeId: string;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy: string | null;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt: Date;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
