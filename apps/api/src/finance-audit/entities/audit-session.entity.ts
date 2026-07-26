import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Sesi audit fisik aset (FR-M4-2). */
@Entity('audit_session')
@Index('idx_audit_session_tenant', ['tenantId', 'status'])
export class AuditSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  scope: Record<string, unknown>;

  @Column({ name: 'started_by', type: 'uuid', nullable: true })
  startedBy: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ length: 20, default: 'PLANNED' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
