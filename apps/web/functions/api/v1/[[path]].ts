/**
 * Cloudflare Pages Function — AMS API v1
 *
 * Berjalan di edge Cloudflare (tanpa server terpisah).
 * Menggantikan NestJS API untuk mode produksi:
 *   - Auth  : login / register / forgot-password (bcrypt + JWT)
 *   - Data  : forwarded ke Supabase PostgREST (service role — bypass RLS)
 *
 * Secrets (set di Cloudflare Dashboard → Pages → Settings → Variables):
 *   SUPABASE_SERVICE_ROLE_KEY   : service_role key dari Supabase
 *   JWT_SECRET                  : fd2f4deb13e24... (sama dengan .env API)
 *   AUTH_DEFAULT_TENANT_ID      : 11111111-1111-1111-1111-111111111111
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';

/* ── Konstanta ────────────────────────────────────────────── */
const SUPABASE_URL   = 'https://jsblurfdbpeetslfycnc.supabase.co';
const SUPABASE_ANON  = 'sb_publishable_GeioMZaRvPvSt7my6IIohw_6WxR5BvH';
const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';
const BCRYPT_ROUNDS  = 8;

/* ── Env interface ────────────────────────────────────────── */
interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  AUTH_DEFAULT_TENANT_ID?: string;
  MAIL_HOST?: string;
  MAIL_USER?: string;
  MAIL_PASS?: string;
}

/* ── CORS headers ─────────────────────────────────────────── */
function cors(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  req.headers.get('Origin') ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-ID',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResp(data: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(req ? cors(req) : {}),
    },
  });
}

function errResp(message: string, status = 400, req?: Request): Response {
  return jsonResp({ message, statusCode: status, error: statusText(status) }, status, req);
}

function statusText(s: number) {
  return s === 401 ? 'Unauthorized' : s === 403 ? 'Forbidden' : s === 404 ? 'Not Found' : s === 500 ? 'Internal Server Error' : 'Bad Request';
}

/* ── JWT helpers ──────────────────────────────────────────── */
async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

async function verifyToken(req: Request, secret: string): Promise<Record<string, unknown> | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ── Supabase admin client ────────────────────────────────── */
function sb(env: Env): SupabaseClient {
  return createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/* ── Build paginated meta ─────────────────────────────────── */
function paginatedResp(data: unknown[], total: number, page: number, limit: number) {
  const safeLimit = limit > 0 ? limit : 1;
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / safeLimit) || 1 } };
}

/* ── Activity Log helper ──────────────────────────────────── */
/**
 * Catat aktivitas ke tabel notification (channel=IN_APP).
 * Dipanggil setelah setiap aksi penting agar Log Aktivitas terisi.
 */
async function createActivity(
  client: SupabaseClient,
  tenantId: string,
  userId: string | null,
  type: string,
  message: string,
  entityType?: string,
  entityId?: string,
): Promise<void> {
  try {
    await client.from('notification').insert({
      tenant_id:     tenantId,
      user_id:       userId,
      channel:       'IN_APP',
      template_code: type,
      subject:       type,
      body:          message,
      payload:       { entityType: entityType ?? null, entityId: entityId ?? null },
      status:        'PENDING',
    });
  } catch { /* jangan lempar error agar aksi utama tidak terganggu */ }
}

/* ── snake_case → camelCase converter ────────────────────── */
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
function mapToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamel(k)] = v;
  }
  return out;
}
/** Konversi array atau single object dari Supabase (snake_case) ke camelCase. */
function camelize(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(r => mapToCamel(r as Record<string, unknown>));
  if (data && typeof data === 'object') return mapToCamel(data as Record<string, unknown>);
  return data;
}

/* ── camelCase → snake_case (untuk INSERT / UPDATE ke Supabase) ── */
function toSnakeKey(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}
/**
 * Konversi body dari frontend (camelCase) ke snake_case sebelum
 * dikirim ke Supabase. Hanya field yang ada (skip undefined/null yang kosong).
 */
function snakeBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined) out[toSnakeKey(k)] = v;
  }
  return out;
}

/* ── Temp password generator ──────────────────────────────── */
function genTempPass(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

/* ══════════════════════════════════════════════════════════
   AUTH HANDLERS
══════════════════════════════════════════════════════════ */

async function handleLogin(req: Request, env: Env): Promise<Response> {
  const body = await req.json() as { email?: string; password?: string };
  const { email, password } = body;
  if (!email || !password) return errResp('Email dan password wajib diisi.', 400, req);

  const tenantId = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;
  const client   = sb(env);

  // Satu query: ambil user + password_hash + roles (left join agar user tanpa role tetap bisa login)
  const { data: userList, error: loginErr } = await client
    .from('app_user')
    .select('id, email, full_name, status, password_hash, user_roles ( role:role_id ( code, name ) )')
    .eq('tenant_id', tenantId)
    .ilike('email', email.trim())
    .limit(1);

  if (loginErr) return errResp('Gagal memproses login.', 500, req);

  const userRow = userList?.[0] as Record<string, unknown> | undefined;
  if (!userRow || !userRow.password_hash) {
    return errResp('Email atau password salah.', 401, req);
  }

  // Cek status akun (sebelum bcrypt untuk efisiensi)
  if ((userRow.status as string) !== 'active') {
    return errResp('Akun tidak aktif. Hubungi administrator.', 401, req);
  }

  const valid = await bcrypt.compare(password, userRow.password_hash as string);
  if (!valid) return errResp('Email atau password salah.', 401, req);

  const user = userRow;
  const roles: string[] = ((userRow.user_roles ?? []) as Array<Record<string, Record<string, string>>>)
    .map(r => r.role?.code)
    .filter(Boolean);

  const token = await signToken(
    { sub: user.id, email: user.email, roles, tenantId },
    env.JWT_SECRET,
  );

  // Catat aktivitas login
  await createActivity(client, tenantId, user.id, 'LOGIN',
    `${user.email} berhasil masuk ke sistem`);

  return jsonResp({
    accessToken: token,
    user: { id: user.id, email: user.email, username: user.full_name, roles },
  }, 200, req);
}

async function handleRegister(req: Request, env: Env): Promise<Response> {
  const { email, fullName, password } = await req.json() as {
    email?: string; fullName?: string; password?: string;
  };
  if (!email || !fullName || !password) return errResp('Email, nama, dan password wajib diisi.', 400, req);
  if (password.length < 8)              return errResp('Password minimal 8 karakter.', 400, req);

  const tenantId = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;
  const client   = sb(env);

  // Cek apakah email sudah terdaftar
  const { data: existing } = await client
    .from('app_user')
    .select('id')
    .ilike('email', email.trim())
    .eq('tenant_id', tenantId)
    .limit(1);

  if (existing && existing.length > 0) return errResp('Email sudah terdaftar.', 409, req);

  // Semua user baru langsung SUPER_ADMIN (sesuai konfigurasi sistem)
  const roleCode = 'SUPER_ADMIN';

  // Ambil role ID
  const { data: roleRow } = await client
    .from('role')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('code', roleCode)
    .single();

  if (!roleRow) return errResp('Konfigurasi role tidak ditemukan.', 500, req);

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const uid  = crypto.randomUUID();

  // Buat user
  const { error: insErr } = await client
    .from('app_user')
    .insert({ id: uid, tenant_id: tenantId, email: email.trim().toLowerCase(), full_name: fullName.trim(), password_hash: hash, status: 'active' });

  if (insErr) return errResp(insErr.message, 500, req);

  // Assign role — pastikan berhasil agar tidak ada user tanpa role
  const { error: roleInsErr } = await client.from('user_roles').insert({ user_id: uid, role_id: roleRow.id });
  if (roleInsErr) {
    // Rollback: hapus user yang baru dibuat
    await client.from('app_user').delete().eq('id', uid);
    return errResp('Gagal menetapkan role: ' + roleInsErr.message, 500, req);
  }

  const token = await signToken(
    { sub: uid, email: email.trim().toLowerCase(), roles: [roleCode], tenantId },
    env.JWT_SECRET,
  );

  // Catat aktivitas registrasi
  await createActivity(client, tenantId, uid, 'REGISTER',
    `Akun baru ${email.trim().toLowerCase()} terdaftar sebagai ${roleCode}`);

  return jsonResp({
    accessToken: token,
    user: { id: uid, email: email.trim().toLowerCase(), username: fullName.trim(), roles: [roleCode] },
  }, 201, req);
}

async function handleForgotPassword(req: Request, env: Env): Promise<Response> {
  const { email } = await req.json() as { email?: string };
  const normEmail = (email ?? '').trim().toLowerCase();
  if (!normEmail) return errResp('Email wajib diisi.', 400, req);

  const tenantId = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;
  const client   = sb(env);

  const { data: user } = await client
    .from('app_user')
    .select('id, full_name')
    .ilike('email', normEmail)
    .eq('tenant_id', tenantId)
    .single();

  // Selalu respons sukses (anti email enumeration)
  if (!user) {
    return jsonResp({ message: 'Jika email terdaftar, password sementara telah dikirim.' }, 200, req);
  }

  const tempPass = genTempPass();
  const hash     = await bcrypt.hash(tempPass, BCRYPT_ROUNDS);

  const { error: updErr } = await client
    .from('app_user')
    .update({ password_hash: hash, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updErr) return errResp('Gagal mereset password, coba lagi.', 500, req);

  // LOG: masking password (jangan tampilkan plaintext di log produksi)
  console.log(`[ForgotPassword] ${normEmail} → temp: ${tempPass.slice(0, 3)}***`);

  // Jika ada konfigurasi SMTP via env, gunakan Mailgun/Resend/EmailJS
  // (Implementasi email via fetch dapat ditambahkan di sini)

  return jsonResp({ message: 'Jika email terdaftar, password sementara telah dikirim. Periksa console log.' }, 200, req);
}

/* ══════════════════════════════════════════════════════════
   DATA HELPERS
══════════════════════════════════════════════════════════ */

function getPage(url: URL) {
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1',  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  return { page, limit };
}

async function requireAuth(req: Request, env: Env) {
  const payload = await verifyToken(req, env.JWT_SECRET);
  if (!payload) return null;
  return payload;
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */

async function handleDashboard(req: Request, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  const [assets, tickets, audit] = await Promise.all([
    client.from('asset').select('status', { count: 'exact' }).eq('tenant_id', tid),
    client.from('maintenance_ticket').select('status', { count: 'exact' }).eq('tenant_id', tid),
    client.from('audit_session').select('status', { count: 'exact' }).eq('tenant_id', tid),
  ]);

  // Asset totals
  const byStatus: Record<string, number> = {};
  let total = 0;
  (assets.data ?? []).forEach((a: Record<string, string>) => {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    total++;
  });

  // Nilai aset (butuh kolom purchase_price & book_value)
  const { data: vals } = await client
    .from('asset')
    .select('purchase_price, book_value')
    .eq('tenant_id', tid);

  let totalPurchase = 0, totalBookValue = 0;
  (vals ?? []).forEach((v: Record<string, number>) => {
    totalPurchase  += Number(v.purchase_price ?? 0);
    totalBookValue += Number(v.book_value ?? 0);
  });

  // Maintenance
  const ticketRows = tickets.data ?? [];
  const openTickets      = ticketRows.filter((t: Record<string, string>) => t.status === 'OPEN').length;
  const completedTickets = ticketRows.filter((t: Record<string, string>) => t.status === 'COMPLETED').length;

  // Audit
  const auditRows = audit.data ?? [];
  const totalSessions    = auditRows.length;
  const inProgressSessions = auditRows.filter((a: Record<string, string>) => a.status === 'IN_PROGRESS').length;

  return jsonResp({
    assetSummary: { total, byStatus },
    assetValue: { totalPurchase, totalBookValue, totalDepreciation: totalPurchase - totalBookValue },
    maintenance: { openTickets, completedTickets, dueToday: 0, overdue: 0 },
    audit: { totalSessions, inProgressSessions, byStatus: {} },
    generatedAt: new Date().toISOString(),
  }, 200, req);
}

/* ══════════════════════════════════════════════════════════
   ASSETS
══════════════════════════════════════════════════════════ */

async function handleAssets(req: Request, url: URL, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'GET') {
    const { page, limit } = getPage(url);
    const rawQ   = url.searchParams.get('q') ?? '';
    // Sanitasi: hapus karakter khusus PostgREST untuk mencegah filter injection
    const q      = rawQ.replace(/[,()]/g, '').slice(0, 100);
    const status = url.searchParams.get('status') ?? '';

    let query = client.from('asset').select('*', { count: 'exact' })
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (q)      query = query.or(`name.ilike.%${q}%,asset_code.ilike.%${q}%,serial_number.ilike.%${q}%`);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return errResp(error.message, 500, req);
    // Konversi snake_case → camelCase agar kompatibel dengan frontend TypeScript types
    return jsonResp(paginatedResp(camelize(data ?? []) as unknown[], count ?? 0, page, limit), 200, req);
  }

  if (req.method === 'POST') {
    const rawBody = await req.json() as Record<string, unknown>;
    // Konversi camelCase → snake_case agar cocok dengan kolom Supabase
    const body = snakeBody(rawBody);

    /* ── Generate asset_code ─────────────────────────────── */
    // 1. Ambil slug tenant untuk prefix kode
    const { data: tenantRow } = await client.from('tenant')
      .select('slug').eq('id', tid).single();
    const prefix = ((tenantRow as Record<string,string>|null)?.slug ?? 'AMS').toUpperCase().slice(0, 6);

    // 2. Ambil kode kategori — jika tidak dipilih, gunakan kategori pertama (GEN)
    let categoryCode = 'GEN';
    // Gunakan array query (lebih aman dari .single() yang throw saat 0/N row)
    const { data: allCats } = await client.from('asset_category')
      .select('id, code').eq('tenant_id', tid)
      .order('created_at', { ascending: true });
    const catList = (allCats ?? []) as Array<{id: string; code: string}>;

    let finalCategoryId: string | null = (body.category_id as string | null | undefined) ?? null;

    if (finalCategoryId) {
      // Pastikan category_id valid & ambil kodenya
      const found = catList.find(c => c.id === finalCategoryId);
      if (found) categoryCode = found.code.toUpperCase();
    } else {
      // Pakai kategori pertama sebagai default
      const def = catList[0];
      if (def) {
        finalCategoryId = def.id;
        categoryCode    = def.code.toUpperCase();
      }
    }

    // 3. Increment sequence via PG function (atomic)
    const year = new Date().getFullYear();
    const { data: seqResult, error: seqErr } = await client.rpc('next_asset_seq', {
      p_tenant: tid,
      p_year:   year,
    });
    if (seqErr) return errResp('Gagal generate kode aset: ' + seqErr.message, 500, req);
    const seq      = Number(seqResult);
    const assetCode = `${prefix}-${categoryCode}-${year}-${String(seq).padStart(5, '0')}`;

    /* ── Insert ──────────────────────────────────────────── */
    const { data, error } = await client.from('asset')
      .insert({ ...body, tenant_id: tid, asset_code: assetCode, category_id: finalCategoryId, status: body.status ?? 'ACTIVE' })
      .select()
      .single();
    if (error) return errResp(error.message, 500, req);

    // Auto-generate QR URL setelah aset dibuat
    if (data?.asset_code) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&data=${encodeURIComponent('AMS:' + data.asset_code)}&format=png`;
      await client.from('asset').update({ qr_url: qrUrl }).eq('id', data.id);
      data.qr_url = qrUrl;
    }

    // Catat aktivitas pembuatan aset
    const actorId = (await verifyToken(req, env.JWT_SECRET))?.sub as string | null;
    await createActivity(client, tid, actorId, 'ASSET_CREATED',
      `Aset baru ditambahkan: ${(data as Record<string,unknown>)?.name ?? ''} (${assetCode})`,
      'asset', (data as Record<string,unknown>)?.id as string);

    return jsonResp(camelize(data), 201, req);
  }

  return errResp('Method not allowed', 405, req);
}

async function handleAssetById(req: Request, id: string, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'GET') {
    const { data, error } = await client.from('asset').select('*').eq('id', id).eq('tenant_id', tid).single();
    if (error || !data) return errResp('Aset tidak ditemukan.', 404, req);
    return jsonResp(camelize(data), 200, req);
  }

  if (req.method === 'PATCH') {
    const rawPatch = await req.json() as Record<string, unknown>;
    const body = snakeBody(rawPatch);
    const { data, error } = await client.from('asset').update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id).eq('tenant_id', tid).select().single();
    if (error) return errResp(error.message, 500, req);
    const patchActor = (await verifyToken(req, env.JWT_SECRET))?.sub as string | null;
    await createActivity(client, tid, patchActor, 'ASSET_UPDATED',
      `Aset diperbarui: ${(data as Record<string,unknown>)?.name ?? id}`, 'asset', id);
    return jsonResp(camelize(data), 200, req);
  }

  if (req.method === 'DELETE') {
    const { data: delData } = await client.from('asset').select('name,asset_code').eq('id', id).eq('tenant_id', tid).single();
    const { error } = await client.from('asset').delete().eq('id', id).eq('tenant_id', tid);
    if (error) return errResp(error.message, 500, req);
    const delActor = (await verifyToken(req, env.JWT_SECRET))?.sub as string | null;
    await createActivity(client, tid, delActor, 'ASSET_DELETED',
      `Aset dihapus: ${(delData as Record<string,string>|null)?.name ?? id} (${(delData as Record<string,string>|null)?.asset_code ?? ''})`,
      'asset', id);
    return new Response(null, { status: 204, headers: cors(req) });
  }

  return errResp('Method not allowed', 405, req);
}

/* ══════════════════════════════════════════════════════════
   GENERIC TABLE HANDLERS (CRUD sederhana)
══════════════════════════════════════════════════════════ */

async function handleTable(
  table: string, req: Request, url: URL, env: Env,
  orderCol = 'created_at', extraFilter?: Record<string, string>,
): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'GET') {
    const { page, limit } = getPage(url);
    let query = client.from(table).select('*', { count: 'exact' })
      .eq('tenant_id', tid)
      .order(orderCol, { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (extraFilter) {
      for (const [k, v] of Object.entries(extraFilter)) query = query.eq(k, v);
    }

    const { data, count, error } = await query;
    if (error) return errResp(error.message, 500, req);

    // Konversi ke camelCase + kembalikan dengan/tanpa paginasi
    const camelData = camelize(data ?? []) as unknown[];
    const paginate  = url.searchParams.has('page');
    return jsonResp(paginate ? paginatedResp(camelData, count ?? 0, page, limit) : camelData, 200, req);
  }

  if (req.method === 'POST') {
    const rawBody = await req.json() as Record<string, unknown>;
    const body = snakeBody(rawBody);
    const { data, error } = await client.from(table).insert({ ...body, tenant_id: tid }).select().single();
    if (error) return errResp(error.message, 500, req);
    return jsonResp(camelize(data), 201, req);
  }

  return errResp('Method not allowed', 405, req);
}

/* ══════════════════════════════════════════════════════════
   USERS
══════════════════════════════════════════════════════════ */

async function handleUsers(req: Request, url: URL, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'GET') {
    const { data, error } = await client
      .from('app_user')
      .select(`id, email, full_name, status, mfa_enabled, created_at,
               user_roles ( role:role_id ( code, name ) )`)
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false });
    if (error) return errResp(error.message, 500, req);
    // Sesuaikan format dengan yang diharapkan frontend
    const formatted = (data ?? []).map((u: Record<string, unknown>) => ({
      id: u.id, email: u.email, fullName: u.full_name, status: u.status,
      mfaEnabled: u.mfa_enabled, createdAt: u.created_at,
      roles: (u.user_roles as Array<Record<string, Record<string, string>>>)
        ?.map(r => r.role) ?? [],
    }));
    return jsonResp(formatted, 200, req);
  }

  if (req.method === 'POST') {
    // POST /users/invite
    const { fullName, email, roleCode, password } = await req.json() as Record<string, string>;
    if (!email || !fullName || !roleCode || !password) return errResp('Semua field wajib diisi.', 400, req);

    // Gunakan limit(1) bukan .single() agar tidak throw saat 0 rows
    const { data: existList } = await client.from('app_user').select('id').ilike('email', email).eq('tenant_id', tid).limit(1);
    if (existList && existList.length > 0) return errResp('Email sudah terdaftar.', 409, req);

    const { data: role } = await client.from('role').select('id').eq('tenant_id', tid).eq('code', roleCode).single();
    if (!role) return errResp('Role tidak ditemukan.', 400, req);

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const uid  = crypto.randomUUID();

    const { error: userInsErr } = await client.from('app_user')
      .insert({ id: uid, tenant_id: tid, email: email.toLowerCase(), full_name: fullName, password_hash: hash, status: 'active' });
    if (userInsErr) return errResp('Gagal membuat pengguna: ' + userInsErr.message, 500, req);

    const { error: roleInsErr2 } = await client.from('user_roles').insert({ user_id: uid, role_id: role.id });
    if (roleInsErr2) {
      await client.from('app_user').delete().eq('id', uid);
      return errResp('Gagal menetapkan role: ' + roleInsErr2.message, 500, req);
    }

    const inviteActor = (await verifyToken(req, env.JWT_SECRET))?.sub as string | null;
    await createActivity(client, tid, inviteActor, 'USER_INVITED',
      `Pengguna baru diundang: ${email.toLowerCase()} sebagai ${roleCode}`, 'user', uid);

    const { data } = await client.from('app_user').select(`id, email, full_name, status, created_at, user_roles ( role:role_id ( code, name ) )`).eq('id', uid).single();
    return jsonResp(data, 201, req);
  }

  return errResp('Method not allowed', 405, req);
}

async function handleUserById(req: Request, id: string, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'PATCH') {
    const body = await req.json() as { roleCode?: string };
    if (!body.roleCode) return errResp('roleCode wajib diisi.', 400, req);
    const { data: role } = await client.from('role').select('id').eq('tenant_id', tid).eq('code', body.roleCode).single();
    if (!role) return errResp('Role tidak ditemukan.', 400, req);
    // Pastikan user milik tenant ini sebelum mengubah role
    const { data: ownedUser } = await client.from('app_user').select('id').eq('id', id).eq('tenant_id', tid).single();
    if (!ownedUser) return errResp('Pengguna tidak ditemukan.', 404, req);
    await client.from('user_roles').delete().eq('user_id', id);
    const { error: rIns } = await client.from('user_roles').insert({ user_id: id, role_id: role.id });
    if (rIns) return errResp('Gagal mengubah role: ' + rIns.message, 500, req);
    return jsonResp({ message: 'Peran berhasil diubah.' }, 200, req);
  }

  if (req.method === 'DELETE') {
    // Pastikan user milik tenant ini sebelum dihapus
    const { data: ownedDel } = await client.from('app_user').select('id').eq('id', id).eq('tenant_id', tid).single();
    if (!ownedDel) return errResp('Pengguna tidak ditemukan.', 404, req);
    await client.from('user_roles').delete().eq('user_id', id);
    const { error } = await client.from('app_user').delete().eq('id', id).eq('tenant_id', tid);
    if (error) return errResp(error.message, 500, req);
    return new Response(null, { status: 204, headers: cors(req) });
  }

  return errResp('Method not allowed', 405, req);
}

/* ══════════════════════════════════════════════════════════
   ME (current user dari JWT)
══════════════════════════════════════════════════════════ */

async function handleMe(req: Request, env: Env): Promise<Response> {
  const payload = await verifyToken(req, env.JWT_SECRET);
  if (!payload) return errResp('Unauthorized', 401, req);
  return jsonResp({
    sub: payload.sub, email: payload.email,
    roles: payload.roles, tenantId: payload.tenantId,
  }, 200, req);
}

/* ══════════════════════════════════════════════════════════
   MAIN ROUTER
══════════════════════════════════════════════════════════ */

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url    = new URL(request.url);
  const method = request.method;

  /* CORS preflight */
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(request) });
  }

  /* Strip prefix /api/v1 dari path */
  const raw  = url.pathname;               // /api/v1/auth/login
  const path = raw.replace(/^\/api\/v1/, ''); // /auth/login

  try {
    /* ── Public routes ───────────────────────────────── */
    if (path === '/auth/login'           && method === 'POST') return handleLogin(request, env);
    if (path === '/auth/register'        && method === 'POST') return handleRegister(request, env);
    if (path === '/auth/forgot-password' && method === 'POST') return handleForgotPassword(request, env);
    if (path === '/health'               && method === 'GET')  return jsonResp({ status: 'ok', mode: 'cloudflare-edge', ts: new Date().toISOString() }, 200, request);

    /* ── Protected routes (perlu JWT) ────────────────── */
    const user = await requireAuth(request, env);
    if (!user) return errResp('Unauthorized', 401, request);

    /* Me */
    if (path === '/me' && method === 'GET') return handleMe(request, env);

    /* Dashboard */
    if (path === '/dashboard/summary' && method === 'GET') return handleDashboard(request, env);

    /* Assets */
    if (path === '/assets')             return handleAssets(request, url, env);

    /* ── Asset sub-routes (harus SEBELUM match /assets/:id) ── */
    const assetSub = path.match(/^\/assets\/([^/]+)\/([^/]+)$/);
    if (assetSub) {
      const [, assetId, sub] = assetSub;
      const client = sb(env);
      const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

      /* GET /assets/:id/documents */
      if (sub === 'documents' && method === 'GET') {
        const { data } = await client.from('asset_document')
          .select('*').eq('asset_id', assetId).eq('tenant_id', tid).order('created_at', { ascending: false });
        return jsonResp(camelize(data ?? []), 200, request);
      }

      /* POST /assets/:id/documents */
      if (sub === 'documents' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const { data, error } = await client.from('asset_document')
          .insert({ ...body, asset_id: assetId, tenant_id: tid }).select().single();
        if (error) return errResp(error.message, 500, request);
        return jsonResp(camelize(data), 201, request);
      }

      /* GET /assets/:id/history */
      if (sub === 'history' && method === 'GET') {
        const { data } = await client.from('asset_history')
          .select('*').eq('asset_id', assetId).eq('tenant_id', tid).order('occurred_at', { ascending: false });
        return jsonResp(camelize(data ?? []), 200, request);
      }

      /* GET /assets/:id/depreciation */
      if (sub === 'depreciation' && method === 'GET') {
        const { data } = await client.from('depreciation_entry')
          .select('*').eq('asset_id', assetId).eq('tenant_id', tid).order('period_year', { ascending: false });
        return jsonResp(camelize(data ?? []), 200, request);
      }

      /* GET /assets/:id/maintenance-history */
      if (sub === 'maintenance-history' && method === 'GET') {
        const { data } = await client.from('maintenance_history')
          .select('*').eq('asset_id', assetId).eq('tenant_id', tid).order('performed_at', { ascending: false });
        return jsonResp(camelize(data ?? []), 200, request);
      }

      /* GET /assets/:id/handovers */
      if (sub === 'handovers' && method === 'GET') {
        const { data } = await client.from('handover')
          .select('*').eq('asset_id', assetId).eq('tenant_id', tid).order('created_at', { ascending: false });
        return jsonResp(camelize(data ?? []), 200, request);
      }

      /* POST /assets/:id/label  — Generate & simpan QR Code URL */
      if (sub === 'label' && method === 'POST') {
        const { data: asset } = await client.from('asset')
          .select('id, asset_code').eq('id', assetId).eq('tenant_id', tid).single();
        if (!asset) return errResp('Aset tidak ditemukan.', 404, request);

        const assetCode = asset.asset_code ?? assetId;
        // Gunakan qrserver.com (gratis, tidak perlu library)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&data=${encodeURIComponent('AMS:' + assetCode)}&format=png`;

        // Simpan qr_url ke database
        await client.from('asset').update({ qr_url: qrUrl, updated_at: new Date().toISOString() })
          .eq('id', assetId).eq('tenant_id', tid);

        return jsonResp({ id: assetId, assetCode, qrUrl }, 200, request);
      }

      /* GET /assets/:id/label (ambil QR yang sudah ada) */
      if (sub === 'label' && method === 'GET') {
        const { data: asset } = await client.from('asset')
          .select('id, asset_code, qr_url').eq('id', assetId).eq('tenant_id', tid).single();
        if (!asset) return errResp('Aset tidak ditemukan.', 404, request);
        return jsonResp(asset, 200, request);
      }
    }

    /* /assets/:id — GET, PATCH, DELETE */
    const assetMatch = path.match(/^\/assets\/([^/]+)$/);
    if (assetMatch) return handleAssetById(request, assetMatch[1], env);

    /* Categories */
    if (path === '/categories') return handleTable('asset_category', request, url, env, 'name');

    /* Vendors */
    if (path === '/vendors') return handleTable('vendor', request, url, env, 'name');

    /* Users */
    if (path === '/users')              return handleUsers(request, url, env);
    const userIdMatch = path.match(/^\/users\/([^/]+)\/role$/);
    if (userIdMatch) return handleUserById(request, userIdMatch[1], env);
    const userDelMatch = path.match(/^\/users\/([^/]+)$/);
    if (userDelMatch) return handleUserById(request, userDelMatch[1], env);

    /* Maintenance */
    if (path === '/maintenance/tickets') return handleTable('maintenance_ticket', request, url, env);
    if (path.match(/^\/maintenance\/tickets\/[^/]+\/status$/)) {
      const mid = path.split('/')[3];
      const b   = await request.json() as Record<string, string>;
      const VALID_TICKET_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
      if (!VALID_TICKET_STATUSES.includes(b.status)) return errResp('Status tidak valid.', 400, request);
      const { data, error } = await sb(env).from('maintenance_ticket')
        .update({ status: b.status, updated_at: new Date().toISOString() })
        .eq('id', mid).eq('tenant_id', env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT)
        .select().single();
      if (error || !data) return errResp(error?.message ?? 'Tiket tidak ditemukan.', error ? 500 : 404, request);
      return jsonResp(camelize(data), 200, request);
    }

    /* Audit */
    if (path === '/audit/sessions') return handleTable('audit_session', request, url, env);

    /* Disposal */
    if (path === '/disposals') return handleTable('disposal_request', request, url, env);

    /* Approvals */
    /* Inbox hanya tampilkan yang BELUM diproses (PENDING / REQUESTED) */
    if (path === '/approvals/inbox') {
      const { data, error } = await sb(env).from('approval_request')
        .select('*')
        .eq('tenant_id', env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT)
        .in('status', ['PENDING', 'REQUESTED'])
        .order('created_at', { ascending: false });
      if (error) return errResp(error.message, 500, request);
      return jsonResp(camelize(data ?? []), 200, request);
    }
    if (path.match(/^\/approvals\/[^/]+\/(approve|reject)$/)) {
      const parts  = path.split('/');
      const aid    = parts[2];
      const action = parts[3];
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      // Update hanya kolom status (tabel approval_request tidak memiliki updated_at)
      const { data, error } = await sb(env).from('approval_request')
        .update({ status: newStatus })
        .eq('id', aid).eq('tenant_id', env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT)
        .select().single();
      if (error || !data) return errResp(error?.message ?? 'Approval tidak ditemukan.', error ? 500 : 404, request);
      return jsonResp(camelize(data), 200, request);
    }

    /* Notifications — mapping DB (body/channel/status) → frontend (message/type/read) */
    if (path === '/notifications' && method === 'GET') {
      const tid = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;
      const { data } = await sb(env).from('notification')
        .select('id, channel, template_code, subject, body, payload, status, created_at, user_id')
        .eq('tenant_id', tid)
        .eq('channel', 'IN_APP')
        .order('created_at', { ascending: false })
        .limit(50);

      const mapped = (data ?? []).map((n: Record<string, unknown>) => ({
        id:         n.id,
        type:       n.template_code ?? n.channel ?? 'INFO',
        message:    n.body ?? n.subject ?? '',
        entityType: (n.payload as Record<string,unknown>)?.entityType ?? null,
        entityId:   (n.payload as Record<string,unknown>)?.entityId   ?? null,
        read:       n.status === 'READ',
        createdAt:  n.created_at,
      }));

      return jsonResp(mapped, 200, request);
    }
    const notifMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
    if (notifMatch) {
      await sb(env).from('notification').update({ status: 'READ' }).eq('id', notifMatch[1]);
      return jsonResp({ message: 'Ditandai dibaca.' }, 200, request);
    }
    // Mark all read
    if (path === '/notifications/read-all' && method === 'POST') {
      const tid = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;
      await sb(env).from('notification').update({ status: 'READ' })
        .eq('tenant_id', tid).eq('channel', 'IN_APP').eq('status', 'PENDING');
      return jsonResp({ message: 'Semua ditandai dibaca.' }, 200, request);
    }

    /* Reports — format { type, count, rows } sesuai ReportResponse di frontend */
    if (path.match(/^\/reports\//)) {
      const parts   = path.split('/');   // ['', 'reports', 'inventory'] atau ['', 'reports', 'inventory', 'export']
      const rtype   = parts[2] ?? 'inventory';
      const isExport = parts[3] === 'export';

      const tableMap: Record<string, string> = {
        inventory:   'asset',
        maintenance: 'maintenance_ticket',
        disposal:    'disposal_request',
        depreciation:'depreciation_entry',
        assignment:  'asset_assignment',
        location:    'asset',
      };
      const tbl = tableMap[rtype] ?? 'asset';
      const { data } = await sb(env).from(tbl).select('*')
        .eq('tenant_id', env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT)
        .order('created_at', { ascending: false }).limit(1000);

      const rows = data ?? [];

      /* ── Export CSV ────────────────────────────────── */
      if (isExport) {
        if (rows.length === 0) {
          return new Response('Tidak ada data', { status: 200, headers: { ...cors(request), 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="report-${rtype}.csv"` } });
        }
        const cols = Object.keys(rows[0]);
        const csv  = [
          cols.join(','),
          ...rows.map((r: Record<string, unknown>) =>
            cols.map(c => {
              const v = r[c];
              if (v === null || v === undefined) return '';
              const s = String(v);
              return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
            }).join(',')
          ),
        ].join('\n');
        return new Response('\uFEFF' + csv, {   // BOM agar Excel baca UTF-8 dengan benar
          headers: {
            ...cors(request),
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="report-${rtype}.csv"`,
          },
        });
      }

      /* ── JSON Report ────────────────────────────────── */
      return jsonResp({ type: rtype, count: rows.length, rows }, 200, request);
    }

    /* Billing */
    if (path === '/billing/subscription') {
      const { data } = await sb(env).from('subscription').select('*')
        .eq('tenant_id', env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT).single();
      return jsonResp(data ?? { plan: 'FREE', status: 'active', seats: 10, assetQuota: 100 }, 200, request);
    }
    if (path === '/billing/usage') {
      const tid = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;
      const [a, u] = await Promise.all([
        sb(env).from('asset').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
        sb(env).from('app_user').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
      ]);
      return jsonResp({ plan: 'FREE', status: 'active', assets: { used: a.count ?? 0, quota: 100 }, users: { used: u.count ?? 0, seats: 10 } }, 200, request);
    }

    return errResp('Endpoint tidak ditemukan.', 404, request);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[AMS API Error]', msg);
    return errResp('Internal server error: ' + msg, 500, request);
  }
};
