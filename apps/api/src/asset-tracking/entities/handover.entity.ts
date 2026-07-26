import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Serah terima digital (FR-M2-4): tanda tangan, foto, catatan kondisi. */
@Entity('handover')
@Index('idx_handover_tenant_asset', ['tenantId', 'assetId'])
export class Handover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'ref_type', type: 'varchar', length: 20, nullable: true })
  refType: string | null;

  @Column({ name: 'ref_id', type: 'uuid', nullable: true })
  refId: string | null;

  @Column({ name: 'from_user_id', type: 'uuid', nullable: true })
  fromUserId: string | null;

  @Column({ name: 'to_user_id', type: 'uuid', nullable: true })
  toUserId: string | null;

  @Column({ name: 'signature_key', type: 'text', nullable: true })
  signatureKey: string | null;

  @Column({ name: 'photo_keys', type: 'jsonb', default: () => "'[]'::jsonb" })
  photoKeys: string[];

  @Column({ name: 'condition_note', type: 'text', nullable: true })
  conditionNote: string | null;

  @CreateDateColumn({ name: 'signed_at', type: 'timestamptz' })
  signedAt: Date;
}
