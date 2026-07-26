import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Metering penggunaan per tenant (aset/user/storage). */
@Entity('usage_metric')
@Index('idx_usage_tenant_metric', ['tenantId', 'metric'])
export class UsageMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 20 })
  metric: string;

  @Column({ type: 'bigint', default: 0, transformer: numericTransformer })
  value: number;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'now()' })
  recordedAt: Date;
}
