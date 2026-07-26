import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Langganan SaaS per tenant (satu langganan aktif per tenant). */
@Entity('subscription')
@Index('uq_subscription_tenant', ['tenantId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'plan_code', length: 20, default: 'STANDARD' })
  planCode: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ type: 'int', default: 10 })
  seats: number;

  @Column({ name: 'asset_quota', type: 'int', default: 1000 })
  assetQuota: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
