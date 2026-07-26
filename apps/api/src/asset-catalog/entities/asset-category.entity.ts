import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('asset_category')
@Index('uq_category_tenant_code', ['tenantId', 'code'], { unique: true })
export class AssetCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 30 })
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'default_useful_life_years', type: 'int', nullable: true })
  defaultUsefulLifeYears: number | null;

  @Column({ name: 'default_depreciation_method', length: 30, default: 'STRAIGHT_LINE' })
  defaultDepreciationMethod: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
