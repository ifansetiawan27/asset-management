import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { Role } from '../role/role.entity';
import { User } from './user.entity';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly tenant: TenantService) {}

  /** Semua pengguna pada tenant aktif (RLS memfilter otomatis). */
  findAll(): Promise<User[]> {
    return this.tenant.withTenant((em) =>
      em.find(User, { order: { createdAt: 'ASC' } }),
    );
  }

  /**
   * Undang pengguna baru: buat akun dengan password awal dan peran yang dipilih.
   * Admin berbagi email + password ke pengguna yang diundang.
   * Hanya SUPER_ADMIN yang dapat memanggil endpoint ini.
   */
  async invite(dto: InviteUserDto): Promise<User> {
    const normEmail = dto.email.trim().toLowerCase();

    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;

      const existing = await em.findOne(User, {
        where: { tenantId, email: normEmail },
      });
      if (existing) {
        throw new ConflictException('Email sudah terdaftar pada tenant ini.');
      }

      const role = await em.findOne(Role, {
        where: { tenantId, code: dto.roleCode },
      });
      if (!role) {
        throw new BadRequestException(
          `Peran "${dto.roleCode}" tidak ditemukan. Pastikan seed sudah dijalankan.`,
        );
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = em.create(User, {
        tenantId,
        email: normEmail,
        fullName: dto.fullName.trim(),
        status: 'active',
        mfaEnabled: false,
        passwordHash,
        roles: [role],
      });
      return em.save(user);
    });
  }

  /**
   * Ubah peran pengguna.
   * Hanya SUPER_ADMIN yang dapat memanggil endpoint ini.
   */
  async updateRole(id: string, dto: UpdateUserRoleDto): Promise<User> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;

      const user = await em.findOne(User, { where: { id, tenantId } });
      if (!user) throw new NotFoundException('Pengguna tidak ditemukan.');

      const role = await em.findOne(Role, {
        where: { tenantId, code: dto.roleCode },
      });
      if (!role) {
        throw new BadRequestException(`Peran "${dto.roleCode}" tidak ditemukan.`);
      }

      // Ganti semua role lama dengan role baru (one-role policy)
      user.roles = [role];
      return em.save(user);
    });
  }

  /**
   * Hapus pengguna.
   * Tidak dapat menghapus akun sendiri.
   * Hanya SUPER_ADMIN yang dapat memanggil endpoint ini.
   */
  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('Tidak dapat menghapus akun Anda sendiri.');
    }
    await this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const user = await em.findOne(User, { where: { id, tenantId } });
      if (!user) throw new NotFoundException('Pengguna tidak ditemukan.');
      await em.remove(user);
    });
  }
}
