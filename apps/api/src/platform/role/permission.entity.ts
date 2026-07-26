import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Permission global (resource:action), dipakai lintas tenant. */
@Entity('permission')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
