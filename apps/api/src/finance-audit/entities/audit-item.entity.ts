import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Item hasil audit per aset (FR-M4-2/3). */
@Entity('audit_item')
@Index('idx_audit_item_session', ['tenantId', 'auditSessionId'])
export class AuditItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'audit_session_id', type: 'uuid' })
  auditSessionId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'auditor_user_id', type: 'uuid', nullable: true })
  auditorUserId: string | null;

  @Column({ length: 20 })
  status: string;

  @Column({ name: 'expected_location_id', type: 'uuid', nullable: true })
  expectedLocationId: string | null;

  @Column({ name: 'actual_location_id', type: 'uuid', nullable: true })
  actualLocationId: string | null;

  @Column({ name: 'condition_note', type: 'text', nullable: true })
  conditionNote: string | null;

  @Column({ name: 'photo_keys', type: 'jsonb', default: () => "'[]'::jsonb" })
  photoKeys: string[];

  /** Idempotency key untuk sinkronisasi audit offline (mobile). */
  @Column({ name: 'client_id', type: 'varchar', length: 100, nullable: true })
  clientId: string | null;

  @Column({ name: 'audited_at', type: 'timestamptz', default: () => 'now()' })
  auditedAt: Date;
}
