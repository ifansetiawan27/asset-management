import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Jadwal preventive maintenance (FR-M3-1). */
@Entity('maintenance_schedule')
@Index('idx_schedule_tenant_asset', ['tenantId', 'assetId'])
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ length: 20 })
  frequency: string;

  @Column({ name: 'interval_days', type: 'int', nullable: true })
  intervalDays: number | null;

  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate: string;

  @Column({ name: 'last_done_date', type: 'date', nullable: true })
  lastDoneDate: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
