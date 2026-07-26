import 'reflect-metadata';
import { EntityManager } from 'typeorm';

import { AppDataSource } from '../data-source';
import { Permission } from '../../platform/role/permission.entity';
import { Role } from '../../platform/role/role.entity';
import { Tenant } from '../../platform/tenant/tenant.entity';
import { User } from '../../platform/user/user.entity';
import { AssetCategory } from '../../asset-catalog/entities/asset-category.entity';
import { PERMISSIONS, SYSTEM_ROLE_DEFINITIONS } from '../../shared/rbac/roles.enum';

// UUID tetap untuk tenant demo agar konsisten dengan klaim `tenant_id` di Keycloak.
const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';

async function seedPermissions(em: EntityManager): Promise<Map<string, Permission>> {
  for (const code of PERMISSIONS) {
    const exists = await em.findOne(Permission, { where: { code } });
    if (!exists) {
      await em.save(em.create(Permission, { code, description: code }));
    }
  }
  const all = await em.find(Permission);
  return new Map(all.map((p) => [p.code, p]));
}

async function seedTenant(em: EntityManager): Promise<Tenant> {
  let tenant = await em.findOne(Tenant, { where: { slug: 'demo' } });
  if (!tenant) {
    tenant = await em.save(
      em.create(Tenant, {
        id: DEMO_TENANT_ID,
        name: 'Demo Corp',
        slug: 'demo',
        tier: 'standard',
        status: 'active',
        settings: {},
      }),
    );
  }
  return tenant;
}

async function seedRoles(
  em: EntityManager,
  tenantId: string,
  permByCode: Map<string, Permission>,
): Promise<Map<string, Role>> {
  const roleByCode = new Map<string, Role>();
  for (const def of SYSTEM_ROLE_DEFINITIONS) {
    const perms = def.permissions
      .map((code) => permByCode.get(code))
      .filter((p): p is Permission => Boolean(p));

    let role = await em.findOne(Role, { where: { tenantId, code: def.code } });
    if (!role) {
      role = em.create(Role, {
        tenantId,
        code: def.code,
        name: def.name,
        isSystem: true,
        permissions: perms,
      });
    } else {
      role.name = def.name;
      role.isSystem = true;
      role.permissions = perms;
    }
    role = await em.save(role);
    roleByCode.set(def.code, role);
  }
  return roleByCode;
}

async function seedSuperAdmin(
  em: EntityManager,
  tenantId: string,
  roleByCode: Map<string, Role>,
): Promise<User> {
  const email = 'admin@demo.local';
  let admin = await em.findOne(User, { where: { tenantId, email } });
  if (!admin) {
    const superAdmin = roleByCode.get('SUPER_ADMIN');
    admin = em.create(User, {
      tenantId,
      email,
      fullName: 'Demo Super Admin',
      status: 'active',
      mfaEnabled: false,
      roles: superAdmin ? [superAdmin] : [],
    });
    admin = await em.save(admin);
  }
  return admin;
}

async function seedDefaultCategory(em: EntityManager, tenantId: string): Promise<void> {
  const code = 'GEN';
  const exists = await em.findOne(AssetCategory, { where: { tenantId, code } });
  if (!exists) {
    await em.save(
      em.create(AssetCategory, {
        tenantId,
        code,
        name: 'General',
        defaultUsefulLifeYears: 4,
        defaultDepreciationMethod: 'STRAIGHT_LINE',
      }),
    );
  }
}

async function run(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (em) => {
      const permByCode = await seedPermissions(em);
      const tenant = await seedTenant(em);

      // Set konteks tenant (agar juga aman bila dijalankan sebagai non-superuser)
      await em.query('SELECT set_config($1, $2, true)', ['app.current_tenant', tenant.id]);

      const roleByCode = await seedRoles(em, tenant.id, permByCode);
      await seedSuperAdmin(em, tenant.id, roleByCode);
      await seedDefaultCategory(em, tenant.id);

      console.log('=====================================================');
      console.log(' Seed berhasil.');
      console.log(` Tenant  : ${tenant.name} (slug: ${tenant.slug})`);
      console.log(` TENANT_ID = ${tenant.id}`);
      console.log(` Role dibuat: ${roleByCode.size} (7 role sistem)`);
      console.log(' Kategori default: GEN (General)');
      console.log(' Super Admin: admin@demo.local');
      console.log('');
      console.log(' Uji API: sertakan header  X-Tenant-ID: ' + tenant.id);
      console.log('=====================================================');
    });
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
