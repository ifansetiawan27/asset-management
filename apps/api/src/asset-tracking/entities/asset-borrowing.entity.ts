import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Peminjaman aset (FR-M2-3). */
@Entity('asset_borrowing')
@Index('idx_borrowing_tenant_asset', ['tenantId', 'assetId'])
export class AssetBorrowing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'borrower_user_id', type: 'uuid', nullable: true })
  borrowerUserId: string | null;

  @Column({ name: 'borrow_date', type: 'timestamptz', nullable: true })
  borrowDate: Date | null;

  @Column({ name: 'due_return_date', type: 'date', nullable: true })
  dueReturnDate: string | null;

  @Column({ name: 'actual_return_date', type: 'timestamptz', nullable: true })
  actualReturnDate: Date | null;

  @Column({ name: 'condition_before', type: 'text', nullable: true })
  conditionBefore: string | null;

  @Column({ name: 'condition_after', type: 'text', nullable: true })
  conditionAfter: string | null;

  @Column({ length: 20, default: 'REQUESTED' })
  status: string;

  @Column({ name: 'approval_request_id', type: 'uuid', nullable: true })
  approvalRequestId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
