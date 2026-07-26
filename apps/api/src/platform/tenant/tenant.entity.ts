import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Tenant = organisasi (ruang data terisolasi) pada SaaS multi-tenant. */
@Entity('tenant')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 63, unique: true })
  slug: string;

  @Column({ length: 20, default: 'standard' })
  tier: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  region: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  settings: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
