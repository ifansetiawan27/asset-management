import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Work order untuk teknisi (FR-M3-3). */
@Entity('work_order')
@Index('idx_work_order_tenant_asset', ['tenantId', 'assetId'])
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId: string | null;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'technician_user_id', type: 'uuid', nullable: true })
  technicianUserId: string | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ type: 'text', nullable: true })
  complaint: string | null;

  @Column({ name: 'maintenance_type', length: 20, default: 'CORRECTIVE' })
  maintenanceType: string;

  @Column({
    name: 'estimated_cost',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  estimatedCost: number | null;

  @Column({
    name: 'actual_cost',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  actualCost: number | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ length: 20, default: 'OPEN' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
