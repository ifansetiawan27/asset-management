import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Sparepart yang dipakai pada work order (FR-M3-3). */
@Entity('work_order_part')
@Index('idx_wo_part_tenant_wo', ['tenantId', 'workOrderId'])
export class WorkOrderPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId: string;

  @Column({ name: 'part_name', length: 150 })
  partName: string;

  @Column({ type: 'int', default: 1 })
  qty: number;

  @Column({
    name: 'unit_cost',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  unitCost: number | null;
}
