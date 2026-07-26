import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { numericTransformer } from '../../shared/db/numeric.transformer';

/** Aset (aggregate root) — FR-M1-1. */
@Entity('asset')
@Index('uq_asset_tenant_code', ['tenantId', 'assetCode'], { unique: true })
@Index('idx_asset_tenant_status', ['tenantId', 'status'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_code', length: 50 })
  assetCode: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 120, nullable: true })
  serialNumber: string | null;

  @Column({ name: 'asset_type', type: 'varchar', length: 50, nullable: true })
  assetType: string | null;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: string | null;

  @Column({
    name: 'purchase_price',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  purchasePrice: number | null;

  @Column({
    name: 'salvage_value',
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  salvageValue: number | null;

  @Column({ type: 'char', length: 3, default: 'IDR' })
  currency: string;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null;

  @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
  warrantyExpiry: string | null;

  @Column({ name: 'useful_life_years', type: 'int', nullable: true })
  usefulLifeYears: number | null;

  @Column({ name: 'depreciation_method', length: 30, default: 'STRAIGHT_LINE' })
  depreciationMethod: string;

  @Column({
    name: 'book_value',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  bookValue: number | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'custodian_user_id', type: 'uuid', nullable: true })
  custodianUserId: string | null;

  @Column({ length: 20, default: 'DRAFT' })
  status: string;

  @Column({ name: 'qr_url', type: 'text', nullable: true })
  qrUrl: string | null;

  @Column({ name: 'barcode_url', type: 'text', nullable: true })
  barcodeUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
