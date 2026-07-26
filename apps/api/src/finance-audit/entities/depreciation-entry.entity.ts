import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Entri penyusutan per periode (FR-M4-1) — append-only, idempoten per periode. */
@Entity('depreciation_entry')
@Index('uq_depreciation_period', ['tenantId', 'assetId', 'periodYear', 'periodMonth'], {
  unique: true,
})
export class DepreciationEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'period_year', type: 'int' })
  periodYear: number;

  @Column({ name: 'period_month', type: 'int' })
  periodMonth: number;

  @Column({ length: 30 })
  method: string;

  @Column({
    name: 'opening_value',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: numericTransformer,
  })
  openingValue: number;

  @Column({
    name: 'depreciation_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: numericTransformer,
  })
  depreciationAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, transformer: numericTransformer })
  accumulated: number;

  @Column({
    name: 'book_value',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: numericTransformer,
  })
  bookValue: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
