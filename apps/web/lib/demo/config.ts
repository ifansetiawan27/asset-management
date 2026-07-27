/**
 * Demo Mode — menjalankan aplikasi tanpa backend (NestJS/Keycloak/Postgres).
 * Diaktifkan lewat env `NEXT_PUBLIC_DEMO_MODE=1` (mis. di Netlify).
 *
 * Saat aktif:
 *  - `login()` memvalidasi akun demo di sisi klien & membuat token JWT palsu.
 *  - Semua panggilan API dilayani dari data mock in-memory (lihat data.ts & router.ts).
 */
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === '1' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function isDemo(): boolean {
  return DEMO_MODE;
}

/** Tenant demo (disamakan dengan seed & realm Keycloak). */
export const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';

/** Password seragam untuk semua akun demo. */
export const DEMO_PASSWORD = 'Passw0rd!';

export interface DemoAccount {
  email: string;
  fullName: string;
  roles: string[];
}

/** Akun demo — selaras dengan `docker/keycloak/realm-ams.json`. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'superadmin@demo.local', fullName: 'Super Admin', roles: ['SUPER_ADMIN'] },
  { email: 'assetadmin@demo.local', fullName: 'Asset Administrator', roles: ['ASSET_ADMINISTRATOR'] },
  { email: 'procurement@demo.local', fullName: 'Procurement Officer', roles: ['PROCUREMENT'] },
  { email: 'teknisi@demo.local', fullName: 'Teknisi Lapangan', roles: ['TECHNICIAN'] },
  { email: 'auditor@demo.local', fullName: 'Auditor Internal', roles: ['AUDITOR'] },
  { email: 'manager@demo.local', fullName: 'Department Manager', roles: ['DEPARTMENT_MANAGER'] },
  { email: 'employee@demo.local', fullName: 'Karyawan Demo', roles: ['EMPLOYEE'] },
];

/** Encode base64url dari string UTF-8 (kompatibel dengan decoder di auth.ts). */
function b64urlEncode(input: string): string {
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Validasi kredensial demo & buat token JWT palsu (`header.payload.sig`).
 * Payload memuat klaim yang dibaca `decode()` di auth.ts.
 */
export function demoLogin(email: string, password: string): string {
  const acc = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!acc || password !== DEMO_PASSWORD) {
    throw new Error('Email atau password salah. Password akun demo: Passw0rd!');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    sub: `demo-${acc.email}`,
    email: acc.email,
    preferred_username: acc.email,
    name: acc.fullName,
    tenant_id: DEMO_TENANT_ID,
    realm_access: { roles: acc.roles },
    iat: now,
    exp: now + 8 * 60 * 60,
  };
  return `${b64urlEncode(JSON.stringify(header))}.${b64urlEncode(JSON.stringify(payload))}.demo`;
}
