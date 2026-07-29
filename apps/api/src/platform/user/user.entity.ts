import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from '../role/role.entity';

/** Pengguna per-tenant (memiliki tenant_id, dilindungi RLS). */
@Entity('app_user')
@Index('uq_user_tenant_email', ['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'external_id', type: 'varchar', length: 150, nullable: true })
  externalId: string | null;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  /**
   * Hash password (bcrypt) untuk autentikasi email/password lokal.
   * `select: false` -> tidak ikut terbawa pada query biasa (mis. GET /users)
   * agar hash tidak pernah bocor; login mengambilnya secara eksplisit.
   * Nullable: user hasil SSO/seed lama boleh tidak punya password.
   */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
