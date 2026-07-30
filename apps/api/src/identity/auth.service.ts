import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';

import { MailService } from '../mail/mail.service';

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
  private readonly logger = new Logger(AuthService.name);
  private readonly tenantId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly mailService: MailService,
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

  /**
   * Lupa password: generate password sementara, hash & simpan ke DB,
   * kirim via email. Selalu mengembalikan sukses (tidak bocorkan email terdaftar).
   */
  async forgotPassword(email: string): Promise<void> {
    const normEmail = email.trim().toLowerCase();

    await this.withTenant(async (em) => {
      const user = await em
        .createQueryBuilder(User, 'u')
        .where('u.tenant_id = :t', { t: this.tenantId })
        .andWhere('LOWER(u.email) = :e', { e: normEmail })
        .getOne();

      // Jika email tidak ditemukan, diam-diam keluar (cegah email enumeration).
      if (!user) {
        this.logger.warn(`forgotPassword: email tidak ditemukan (${normEmail})`);
        return;
      }

      const tempPassword = this.generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

      // Update password_hash langsung via raw query untuk menghindari masalah select:false.
      await em.query(
        `UPDATE app_user SET password_hash = $1, updated_at = now() WHERE id = $2`,
        [passwordHash, user.id],
      );

      await this.mailService.sendMail(
        normEmail,
        'Reset Password — AMS Asset Management',
        this.buildResetEmailHtml(user.fullName, tempPassword),
      );

      this.logger.log(`forgotPassword: password sementara dikirim ke ${normEmail}`);
    });
  }

  /** Buat password sementara acak 12 karakter (alfanumerik + simbol). */
  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    const bytes = randomBytes(12);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('');
  }

  /** Template HTML email reset password. */
  private buildResetEmailHtml(fullName: string, tempPassword: string): string {
    return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center">
            <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:12px">A</div>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px">AMS Asset Management</h1>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.75)">Reset Password</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 12px;font-size:15px;color:#1e293b">Halo, <strong>${fullName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6">
              Kami menerima permintaan reset password untuk akun AMS Anda. Berikut adalah <strong>password sementara</strong> yang dapat Anda gunakan untuk masuk:
            </p>
            <!-- Password box -->
            <div style="background:#f8fafc;border:2px dashed #6366f1;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.08em;text-transform:uppercase">Password Sementara</p>
              <p style="margin:0;font-size:24px;font-weight:900;color:#1e293b;letter-spacing:3px;font-family:monospace">${tempPassword}</p>
            </div>
            <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6">
              ⚠️ Segera ganti password Anda setelah berhasil masuk ke aplikasi.<br>
              Password ini hanya boleh digunakan sekali.
            </p>
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
              Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              &copy; 2026 AMS Asset Management System &nbsp;·&nbsp; Email otomatis, jangan dibalas.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
