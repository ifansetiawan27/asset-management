import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, EntityManager } from 'typeorm';

import { Permission } from '../platform/role/permission.entity';
import { Role } from '../platform/role/role.entity';
import { Tenant } from '../platform/tenant/tenant.entity';
import { User } from '../platform/user/user.entity';
import {
  PERMISSIONS,
  SYSTEM_ROLE_DEFINITIONS,
  SystemRole,
} from '../shared/rbac/roles.enum';

const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const BCRYPT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    tenantId: string;
    roles: string[];
  };
}

/**
 * Autentikasi email/password lokal (tanpa Keycloak).
 *
 * Deployment single-tenant: seluruh akun berada pada satu tenant default,
 * sehingga `app.current_tenant` dapat diset lebih dulu dan RLS tetap aktif
 * tanpa perlu bypass. User aktif (ber-password) pertama otomatis SUPER_ADMIN,
 * berikutnya EMPLOYEE. Tenant + 7 role sistem di-bootstrap otomatis (idempotent)
 * agar aplikasi siap dipakai tanpa langkah seed manual.
 */
@Injectable()
export class AuthService {
  private readonly tenantId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.tenantId =
      this.config.get<string>('auth.defaultTenantId') ?? DEFAULT_TENANT_ID;
  }

  /** Eksekusi callback dalam transaksi dengan konteks tenant aktif (RLS). */
  private withTenant<T>(cb: (em: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (em) => {
      await em.query('SELECT set_config($1, $2, true)', [
        'app.current_tenant',
        this.tenantId,
      ]);
      return cb(em);
    });
  }

  async register(
    email: string,
    fullName: string,
    password: string,
  ): Promise<AuthResult> {
    const normEmail = email.trim().toLowerCase();

    return this.withTenant(async (em) => {
      await this.ensureBootstrap(em);

      const existing = await em.findOne(User, {
        where: { tenantId: this.tenantId, email: normEmail },
      });
      if (existing) {
        throw new ConflictException('Email sudah terdaftar.');
      }

      // User ber-password pertama menjadi SUPER_ADMIN; berikutnya EMPLOYEE.
      const activatedCount = await em
        .createQueryBuilder(User, 'u')
        .where('u.tenant_id = :t', { t: this.tenantId })
        .andWhere('u.password_hash IS NOT NULL')
        .getCount();
      const roleCode =
        activatedCount === 0 ? SystemRole.SUPER_ADMIN : SystemRole.EMPLOYEE;
      const role = await em.findOne(Role, {
        where: { tenantId: this.tenantId, code: roleCode },
      });

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = em.create(User, {
        tenantId: this.tenantId,
        email: normEmail,
        fullName: fullName.trim(),
        status: 'active',
        mfaEnabled: false,
        passwordHash,
        roles: role ? [role] : [],
      });
      const saved = await em.save(user);

      return this.buildResult(saved, role ? [role.code] : []);
    });
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normEmail = email.trim().toLowerCase();

    return this.withTenant(async (em) => {
      // passwordHash `select:false` -> ambil eksplisit; roles di-join manual.
      const user = await em
        .createQueryBuilder(User, 'u')
        .addSelect('u.passwordHash')
        .leftJoinAndSelect('u.roles', 'r')
        .where('u.tenant_id = :t', { t: this.tenantId })
        .andWhere('LOWER(u.email) = :e', { e: normEmail })
        .getOne();

      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Email atau password salah.');
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException('Email atau password salah.');
      }
      if (user.status !== 'active') {
        throw new UnauthorizedException('Akun tidak aktif.');
      }

      return this.buildResult(user, (user.roles ?? []).map((r) => r.code));
    });
  }

  private buildResult(user: User, roles: string[]): AuthResult {
    // Klaim dibuat kompatibel dengan decoder frontend & JwtStrategy.
    const payload = {
      sub: user.id,
      email: user.email,
      preferred_username: user.email,
      name: user.fullName,
      tenant_id: user.tenantId,
      realm_access: { roles },
    };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      expiresIn: this.config.get<string>('jwt.expiresIn') ?? '8h',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        roles,
      },
    };
  }

  /**
   * Pastikan tenant default, seluruh permission, dan 7 role sistem tersedia.
   * Idempotent — aman dipanggil pada setiap registrasi. Dijalankan di dalam
   * transaksi ber-konteks tenant sehingga INSERT ke `role` lolos WITH CHECK RLS.
   */
  private async ensureBootstrap(em: EntityManager): Promise<void> {
    // Tenant (tabel tenant tidak ber-RLS).
    const tenant = await em.findOne(Tenant, { where: { id: this.tenantId } });
    if (!tenant) {
      await em.save(
        em.create(Tenant, {
          id: this.tenantId,
          name: 'Organisasi Utama',
          slug: 'default',
          tier: 'standard',
          status: 'active',
          settings: {},
        }),
      );
    }

    // Permission (global).
    const permByCode = new Map<string, Permission>();
    for (const p of await em.find(Permission)) permByCode.set(p.code, p);
    for (const code of PERMISSIONS) {
      if (!permByCode.has(code)) {
        permByCode.set(
          code,
          await em.save(em.create(Permission, { code, description: code })),
        );
      }
    }

    // Role per-tenant (RLS aktif; tenant_id = app.current_tenant).
    for (const def of SYSTEM_ROLE_DEFINITIONS) {
      const exists = await em.findOne(Role, {
        where: { tenantId: this.tenantId, code: def.code },
      });
      if (!exists) {
        const perms = def.permissions
          .map((c) => permByCode.get(c))
          .filter((p): p is Permission => Boolean(p));
        await em.save(
          em.create(Role, {
            tenantId: this.tenantId,
            code: def.code,
            name: def.name,
            isSystem: true,
            permissions: perms,
          }),
        );
      }
    }
  }
}
