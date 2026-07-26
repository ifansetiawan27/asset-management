import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Tiket kerusakan / corrective (FR-M3-2). */
@Entity('maintenance_ticket')
@Index('idx_ticket_tenant_asset', ['tenantId', 'assetId'])
@Index('idx_ticket_tenant_status', ['tenantId', 'status'])
export class MaintenanceTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'reporter_user_id', type: 'uuid', nullable: true })
  reporterUserId: string | null;

  @Column({ type: 'text' })
  problem: string;

  @Column({ length: 20 })
  severity: string;

  @Column({ length: 20, default: 'OPEN' })
  status: string;

  @Column({ length: 20, default: 'CORRECTIVE' })
  type: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
