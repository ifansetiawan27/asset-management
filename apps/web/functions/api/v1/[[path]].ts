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
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
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

  // Ambil user beserta password hash dan roles
  const { data: users } = await client
    .from('app_user')
    .select(`
      id, email, full_name, status,
      user_roles!inner ( role:role_id ( code, name ) )
    `)
    .eq('tenant_id', tenantId)
    .ilike('email', email.trim())
    .not('password_hash', 'is', null)
    .limit(1);

  // Ambil password_hash terpisah (kolom select:false di entity)
  const { data: hashRow } = await client
    .from('app_user')
    .select('password_hash')
    .ilike('email', email.trim())
    .eq('tenant_id', tenantId)
    .single();

  if (!users || users.length === 0 || !hashRow?.password_hash) {
    return errResp('Email atau password salah.', 401, req);
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, hashRow.password_hash as string);
  if (!valid) return errResp('Email atau password salah.', 401, req);

  const roles: string[] = (user as Record<string, unknown[]>).user_roles
    ?.map((r: Record<string, Record<string, string>>) => r.role?.code)
    .filter(Boolean) ?? [];

  const token = await signToken(
    { sub: user.id, email: user.email, roles, tenantId },
    env.JWT_SECRET,
  );

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

  // Hitung berapa user aktif → tentukan role
  const { count } = await client
    .from('app_user')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .not('password_hash', 'is', null);

  // Semua user baru langsung SUPER_ADMIN
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

  // Assign role
  await client.from('user_roles').insert({ user_id: uid, role_id: roleRow.id });

  const token = await signToken(
    { sub: uid, email: email.trim().toLowerCase(), roles: [roleCode], tenantId },
    env.JWT_SECRET,
  );

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

  await client
    .from('app_user')
    .update({ password_hash: hash, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  // Kirim email via nodemailer-style SMTP (fetch ke SMTP over HTTP tidak didukung di Workers)
  // → gunakan Supabase Anon auth reset, atau log temp password di console.
  console.log(`[ForgotPassword] ${normEmail} → temp password: ${tempPass}`);

  // Jika ada konfigurasi SMTP via env, gunakan Mailgun/Resend/EmailJS
  // (Implementasi email via fetch dapat ditambahkan di sini)

  return jsonResp({ message: 'Jika email terdaftar, password sementara telah dikirim. Periksa console log.' }, 200, req);
}

/* ══════════════════════════════════════════════════════════
   DATA HELPERS
══════════════════════════════════════════════════════════ */

function getPage(url: URL) {
  return { page: parseInt(url.searchParams.get('page') ?? '1'), limit: parseInt(url.searchParams.get('limit') ?? '20') };
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
    const q      = url.searchParams.get('q') ?? '';
    const status = url.searchParams.get('status') ?? '';

    let query = client.from('asset').select('*', { count: 'exact' })
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (q)      query = query.ilike('name', `%${q}%`);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return errResp(error.message, 500, req);
    return jsonResp(paginatedResp(data ?? [], count ?? 0, page, limit), 200, req);
  }

  if (req.method === 'POST') {
    const body = await req.json() as Record<string, unknown>;
    const { data, error } = await client.from('asset')
      .insert({ ...body, tenant_id: tid, status: body.status ?? 'DRAFT' })
      .select()
      .single();
    if (error) return errResp(error.message, 500, req);

    // Auto-generate QR URL setelah aset dibuat
    if (data?.asset_code) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&data=${encodeURIComponent('AMS:' + data.asset_code)}&format=png`;
      await client.from('asset').update({ qr_url: qrUrl }).eq('id', data.id);
      data.qrUrl = qrUrl;
    }

    return jsonResp(data, 201, req);
  }

  return errResp('Method not allowed', 405, req);
}

async function handleAssetById(req: Request, id: string, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'GET') {
    const { data, error } = await client.from('asset').select('*').eq('id', id).eq('tenant_id', tid).single();
    if (error || !data) return errResp('Aset tidak ditemukan.', 404, req);
    return jsonResp(data, 200, req);
  }

  if (req.method === 'PATCH') {
    const body = await req.json() as Record<string, unknown>;
    const { data, error } = await client.from('asset').update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id).eq('tenant_id', tid).select().single();
    if (error) return errResp(error.message, 500, req);
    return jsonResp(data, 200, req);
  }

  if (req.method === 'DELETE') {
    const { error } = await client.from('asset').delete().eq('id', id).eq('tenant_id', tid);
    if (error) return errResp(error.message, 500, req);
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

    // Jika tidak ada pagination dari query params, kembalikan array biasa
    const paginate = url.searchParams.has('page');
    return jsonResp(paginate ? paginatedResp(data ?? [], count ?? 0, page, limit) : (data ?? []), 200, req);
  }

  if (req.method === 'POST') {
    const body = await req.json() as Record<string, unknown>;
    const { data, error } = await client.from(table).insert({ ...body, tenant_id: tid }).select().single();
    if (error) return errResp(error.message, 500, req);
    return jsonResp(data, 201, req);
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

    const existing = await client.from('app_user').select('id').ilike('email', email).eq('tenant_id', tid).single();
    if (existing.data) return errResp('Email sudah terdaftar.', 409, req);

    const { data: role } = await client.from('role').select('id').eq('tenant_id', tid).eq('code', roleCode).single();
    if (!role) return errResp('Role tidak ditemukan.', 400, req);

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const uid  = crypto.randomUUID();

    await client.from('app_user').insert({ id: uid, tenant_id: tid, email: email.toLowerCase(), full_name: fullName, password_hash: hash, status: 'active' });
    await client.from('user_roles').insert({ user_id: uid, role_id: role.id });

    const { data } = await client.from('app_user').select(`id, email, full_name, status, created_at, user_roles ( role:role_id ( code, name ) )`).eq('id', uid).single();
    return jsonResp(data, 201, req);
  }

  return errResp('Method not allowed', 405, req);
}

async function handleUserById(req: Request, id: string, env: Env): Promise<Response> {
  const client = sb(env);
  const tid    = env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT;

  if (req.method === 'PATCH') {
    // /users/:id/role
    const { roleCode } = await req.json() as { roleCode: string };
    const { data: role } = await client.from('role').select('id').eq('tenant_id', tid).eq('code', roleCode).single();
    if (!role) return errResp('Role tidak ditemukan.', 400, req);
    await client.from('user_roles').delete().eq('user_id', id);
    await client.from('user_roles').insert({ user_id: id, role_id: role.id });
    return jsonResp({ message: 'Peran berhasil diubah.' }, 200, req);
  }

  if (req.method === 'DELETE') {
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
          .select('*').eq('asset_id', assetId).order('created_at', { ascending: false });
        return jsonResp(data ?? [], 200, request);
      }

      /* POST /assets/:id/documents */
      if (sub === 'documents' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const { data, error } = await client.from('asset_document')
          .insert({ ...body, asset_id: assetId, tenant_id: tid }).select().single();
        if (error) return errResp(error.message, 500, request);
        return jsonResp(data, 201, request);
      }

      /* GET /assets/:id/history */
      if (sub === 'history' && method === 'GET') {
        const { data } = await client.from('asset_history')
          .select('*').eq('asset_id', assetId).order('occurred_at', { ascending: false });
        return jsonResp(data ?? [], 200, request);
      }

      /* GET /assets/:id/depreciation */
      if (sub === 'depreciation' && method === 'GET') {
        const { data } = await client.from('depreciation_entry')
          .select('*').eq('asset_id', assetId).order('period_year', { ascending: false });
        return jsonResp(data ?? [], 200, request);
      }

      /* GET /assets/:id/maintenance-history */
      if (sub === 'maintenance-history' && method === 'GET') {
        const { data } = await client.from('maintenance_history')
          .select('*').eq('asset_id', assetId).order('performed_at', { ascending: false });
        return jsonResp(data ?? [], 200, request);
      }

      /* GET /assets/:id/handovers */
      if (sub === 'handovers' && method === 'GET') {
        const { data } = await client.from('handover')
          .select('*').eq('asset_id', assetId).order('created_at', { ascending: false });
        return jsonResp(data ?? [], 200, request);
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
      const { data, error } = await sb(env).from('maintenance_ticket').update({ status: b.status, updated_at: new Date().toISOString() }).eq('id', mid).select().single();
      if (error) return errResp(error.message, 500, request);
      return jsonResp(data, 200, request);
    }

    /* Audit */
    if (path === '/audit/sessions') return handleTable('audit_session', request, url, env);

    /* Disposal */
    if (path === '/disposals') return handleTable('disposal_request', request, url, env);

    /* Approvals */
    if (path === '/approvals/inbox') return handleTable('approval_request', request, url, env);
    if (path.match(/^\/approvals\/[^/]+\/(approve|reject)$/)) {
      const parts  = path.split('/');
      const aid    = parts[2];
      const action = parts[3];
      const { data } = await sb(env).from('approval_request').update({ status: action === 'approve' ? 'APPROVED' : 'REJECTED', updated_at: new Date().toISOString() }).eq('id', aid).select().single();
      return jsonResp(data, 200, request);
    }

    /* Notifications */
    if (path === '/notifications' && method === 'GET') return handleTable('notification', request, url, env);
    const notifMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
    if (notifMatch) {
      await sb(env).from('notification').update({ read: true }).eq('id', notifMatch[1]);
      return jsonResp({ message: 'Ditandai dibaca.' }, 200, request);
    }

    /* Reports — kembalikan data mentah dari tabel terkait */
    if (path.match(/^\/reports\//)) {
      const rtype = path.split('/')[2];
      const tableMap: Record<string, string> = {
        inventory: 'asset', maintenance: 'maintenance_ticket',
        disposal: 'disposal_request', depreciation: 'depreciation_entry',
        assignment: 'asset_assignment',
      };
      const tbl = tableMap[rtype] ?? 'asset';
      const { data } = await sb(env).from(tbl).select('*')
        .eq('tenant_id', env.AUTH_DEFAULT_TENANT_ID ?? DEFAULT_TENANT)
        .order('created_at', { ascending: false }).limit(500);
      return jsonResp(data ?? [], 200, request);
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
