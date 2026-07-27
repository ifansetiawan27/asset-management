/**
 * Router Demo Mode — memetakan (method, path) ke data mock in-memory.
 * Dipakai oleh lib/api.ts ketika `isDemo()` bernilai true.
 */
import { DashboardSummary, Paginated, Asset } from '../types';
import { genDepreciation, genDocuments, genHistory, genMaintHistory, nextId, store } from './data';

type Method = 'GET' | 'POST' | 'PATCH';
type Body = Record<string, unknown> | undefined;

const delay = (ms = 140) => new Promise<void>((r) => setTimeout(r, ms));

function notFound(method: string, path: string): never {
  throw new Error(`DEMO: endpoint tidak tersedia — ${method} ${path}`);
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* --------------------------- handlers --------------------------- */

function dashboardSummary(): DashboardSummary {
  const byStatus: Record<string, number> = {};
  let totalPurchase = 0;
  let totalBookValue = 0;
  for (const a of store.assets) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    totalPurchase += a.purchasePrice ?? 0;
    totalBookValue += a.bookValue ?? 0;
  }
  const openTickets = store.tickets.filter((t) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const completedTickets = store.tickets.filter((t) => t.status === 'COMPLETED').length;
  return {
    assetSummary: { total: store.assets.length, byStatus },
    assetValue: { totalPurchase, totalBookValue, totalDepreciation: totalPurchase - totalBookValue },
    maintenance: { openTickets, completedTickets, dueToday: store.schedulesDueToday, overdue: store.schedulesOverdue },
    audit: {
      totalSessions: store.auditSessions.length,
      inProgressSessions: store.auditSessions.filter((s) => s.status === 'IN_PROGRESS').length,
      byStatus: store.auditItemsByStatus,
    },
    generatedAt: new Date().toISOString(),
  };
}

function listAssets(qs: URLSearchParams): Paginated<Asset> {
  const page = num(qs.get('page'), 1);
  const limit = num(qs.get('limit'), 10);
  const q = (qs.get('q') ?? '').toLowerCase();
  const status = qs.get('status') ?? '';
  let rows = store.assets.slice();
  if (q) {
    rows = rows.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.assetCode.toLowerCase().includes(q) ||
        (a.serialNumber ?? '').toLowerCase().includes(q),
    );
  }
  if (status) rows = rows.filter((a) => a.status === status);
  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  return { data: rows.slice(start, start + limit), meta: { page, limit, total, totalPages } };
}

function createAsset(b: Record<string, unknown>): Asset {
  const id = nextId('asset', 'ast');
  const code = `AMS-NEW-${String(store.counters.asset).padStart(4, '0')}`;
  const price = typeof b.purchasePrice === 'number' ? b.purchasePrice : null;
  const asset: Asset = {
    id,
    assetCode: code,
    name: String(b.name ?? 'Aset Baru'),
    categoryId: String(b.categoryId ?? store.categories[0]?.id ?? ''),
    brand: (b.brand as string) ?? null,
    model: (b.model as string) ?? null,
    serialNumber: (b.serialNumber as string) ?? null,
    assetType: (b.assetType as string) ?? null,
    status: 'DRAFT',
    purchasePrice: price,
    bookValue: price,
    currency: String(b.currency ?? 'IDR'),
    purchaseDate: (b.purchaseDate as string) ?? null,
    warrantyExpiry: null,
    usefulLifeYears: typeof b.usefulLifeYears === 'number' ? b.usefulLifeYears : null,
    depreciationMethod: 'STRAIGHT_LINE',
    vendorId: (b.vendorId as string) ?? null,
    locationId: null,
    departmentId: null,
    custodianUserId: null,
    qrUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.assets.unshift(asset);
  return asset;
}

function findAsset(id: string): Asset {
  const a = store.assets.find((x) => x.id === id);
  if (!a) throw new Error('Aset tidak ditemukan');
  return a;
}

function reportRows(type: string): Array<Record<string, unknown>> {
  const catName = (id: string) => store.categories.find((c) => c.id === id)?.name ?? '-';
  switch (type) {
    case 'inventory':
      return store.assets.map((a) => ({
        kode: a.assetCode,
        nama: a.name,
        kategori: catName(a.categoryId),
        status: a.status,
        nilaiBuku: a.bookValue ?? 0,
      }));
    case 'location':
      return store.assets.map((a) => ({ kode: a.assetCode, nama: a.name, lokasi: a.locationId ?? '-' }));
    case 'assignment':
      return store.assets
        .filter((a) => a.custodianUserId)
        .map((a) => ({ kode: a.assetCode, nama: a.name, custodian: a.custodianUserId }));
    case 'maintenance':
      return store.tickets.map((t) => ({ tiket: t.id, aset: t.assetId, masalah: t.problem, severity: t.severity, status: t.status }));
    case 'depreciation':
      return store.assets.map((a) => ({
        kode: a.assetCode,
        perolehan: a.purchasePrice ?? 0,
        nilaiBuku: a.bookValue ?? 0,
        akumulasi: (a.purchasePrice ?? 0) - (a.bookValue ?? 0),
      }));
    case 'disposal':
      return store.disposals.map((d) => ({ id: d.id, aset: d.assetId, alasan: d.reason, status: d.status, nilaiJual: d.saleValue ?? 0 }));
    default:
      return [];
  }
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(',');
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

/* --------------------------- dispatcher --------------------------- */

async function dispatch(method: Method, path: string, qs: URLSearchParams, body: Body): Promise<unknown> {
  const seg = path.split('/').filter(Boolean);
  const [a, b, c, d] = seg;
  const bd: Record<string, unknown> = body ?? {};

  // /dashboard/summary
  if (a === 'dashboard' && b === 'summary') return dashboardSummary();

  // /assets ...
  if (a === 'assets') {
    if (seg.length === 1) {
      if (method === 'GET') return listAssets(qs);
      if (method === 'POST') return createAsset(bd);
    }
    if (seg.length === 2) {
      const asset = findAsset(b);
      if (method === 'GET') return asset;
      if (method === 'PATCH') {
        if (typeof bd.status === 'string') asset.status = bd.status;
        asset.updatedAt = new Date().toISOString();
        return asset;
      }
    }
    if (seg.length === 3) {
      const asset = findAsset(b);
      if (method === 'GET' && c === 'documents') return genDocuments(asset);
      if (method === 'GET' && c === 'history') return genHistory(asset);
      if (method === 'GET' && c === 'depreciation') return genDepreciation(asset);
      if (method === 'GET' && c === 'maintenance-history') return genMaintHistory(asset);
      if (method === 'POST' && c === 'label') {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#ffffff"/><g fill="#0f172a"><rect x="12" y="12" width="40" height="40"/><rect x="108" y="12" width="40" height="40"/><rect x="12" y="108" width="40" height="40"/><rect x="24" y="24" width="16" height="16" fill="#ffffff"/><rect x="120" y="24" width="16" height="16" fill="#ffffff"/><rect x="24" y="120" width="16" height="16" fill="#ffffff"/><rect x="72" y="16" width="12" height="12"/><rect x="72" y="40" width="12" height="12"/><rect x="88" y="72" width="12" height="12"/><rect x="72" y="96" width="12" height="12"/><rect x="112" y="112" width="12" height="12"/><rect x="132" y="132" width="12" height="12"/></g><text x="80" y="156" font-size="9" text-anchor="middle" font-family="monospace" fill="#64748b">${asset.assetCode}</text></svg>`;
        asset.qrUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        asset.updatedAt = new Date().toISOString();
        return { qrUrl: asset.qrUrl };
      }
    }
  }

  // /categories
  if (a === 'categories' && seg.length === 1) {
    if (method === 'GET') return store.categories;
    if (method === 'POST') {
      const cat = {
        id: nextId('category', 'cat'),
        code: String(bd.code ?? ''),
        name: String(bd.name ?? ''),
        defaultUsefulLifeYears: typeof bd.defaultUsefulLifeYears === 'number' ? bd.defaultUsefulLifeYears : null,
        defaultDepreciationMethod: String(bd.defaultDepreciationMethod ?? 'STRAIGHT_LINE'),
      };
      store.categories.push(cat);
      return cat;
    }
  }

  // /vendors
  if (a === 'vendors' && seg.length === 1) {
    if (method === 'GET') return store.vendors;
    if (method === 'POST') {
      const ven = {
        id: nextId('vendor', 'ven'),
        code: String(bd.code ?? ''),
        name: String(bd.name ?? ''),
        contact: (bd.contact as string) ?? null,
        email: (bd.email as string) ?? null,
        phone: (bd.phone as string) ?? null,
      };
      store.vendors.push(ven);
      return ven;
    }
  }

  // /users
  if (a === 'users' && seg.length === 1 && method === 'GET') return store.users;

  // /maintenance/...
  if (a === 'maintenance') {
    if (b === 'tickets' && seg.length === 2) {
      if (method === 'GET') return store.tickets;
      if (method === 'POST') {
        const tkt = {
          id: nextId('ticket', 'tkt'),
          assetId: String(bd.assetId ?? ''),
          problem: String(bd.problem ?? ''),
          severity: String(bd.severity ?? 'MEDIUM'),
          status: 'OPEN',
          type: 'CORRECTIVE',
          createdAt: new Date().toISOString(),
        };
        store.tickets.unshift(tkt);
        return tkt;
      }
    }
    if (b === 'schedules' && c === 'run-due' && method === 'POST') {
      const processed = store.schedulesDueToday + store.schedulesOverdue;
      store.schedulesDueToday = 0;
      store.schedulesOverdue = 0;
      return { processed, workOrders: [] };
    }
  }

  // /audit/sessions/...
  if (a === 'audit' && b === 'sessions') {
    if (seg.length === 2) {
      if (method === 'GET') return store.auditSessions;
      if (method === 'POST') {
        const s = {
          id: nextId('audit', 'aud'),
          name: String(bd.name ?? 'Sesi Audit'),
          status: 'PLANNED',
          startedAt: null,
          closedAt: null,
          createdAt: new Date().toISOString(),
        };
        store.auditSessions.unshift(s);
        return s;
      }
    }
    if (seg.length === 4 && method === 'POST') {
      const s = store.auditSessions.find((x) => x.id === c);
      if (!s) throw new Error('Sesi audit tidak ditemukan');
      if (d === 'start') {
        s.status = 'IN_PROGRESS';
        s.startedAt = new Date().toISOString();
      } else if (d === 'close') {
        s.status = 'CLOSED';
        s.closedAt = new Date().toISOString();
      }
      return s;
    }
  }

  // /approvals/...
  if (a === 'approvals') {
    if (b === 'inbox' && method === 'GET') return store.approvals.filter((x) => x.status === 'REQUESTED');
    if (seg.length === 3 && method === 'POST') {
      const req = store.approvals.find((x) => x.id === b);
      if (!req) throw new Error('Permintaan approval tidak ditemukan');
      if (c === 'approve') req.status = 'APPROVED';
      else if (c === 'reject') req.status = 'REJECTED';
      return req;
    }
  }

  // /disposals/...
  if (a === 'disposals') {
    if (seg.length === 1) {
      if (method === 'GET') return store.disposals;
      if (method === 'POST') {
        const dsp = {
          id: nextId('disposal', 'dsp'),
          assetId: String(bd.assetId ?? ''),
          reason: String(bd.reason ?? 'DAMAGED'),
          status: 'UNDER_REVIEW',
          saleValue: null,
          disposedAt: null,
          createdAt: new Date().toISOString(),
        };
        store.disposals.unshift(dsp);
        return dsp;
      }
    }
    if (seg.length === 3 && method === 'POST') {
      const dsp = store.disposals.find((x) => x.id === b);
      if (!dsp) throw new Error('Disposal tidak ditemukan');
      if (c === 'finalize') {
        dsp.status = 'DISPOSED';
        dsp.disposedAt = new Date().toISOString();
      } else if (c === 'archive') {
        dsp.status = 'ARCHIVED';
      }
      return dsp;
    }
  }

  // /billing/...
  if (a === 'billing') {
    if (b === 'subscription' && method === 'GET') return store.subscription;
    if (b === 'usage' && method === 'GET') {
      return {
        plan: store.subscription.planCode,
        status: store.subscription.status,
        assets: { used: store.assets.length, quota: store.subscription.assetQuota },
        users: { used: store.users.length, seats: store.subscription.seats },
      };
    }
  }

  // /reports/:type
  if (a === 'reports' && b && seg.length === 2 && method === 'GET') {
    const rows = reportRows(b);
    return { type: b, count: rows.length, rows };
  }

  return notFound(method, path);
}

/** Entry point untuk apiGet/apiPost/apiPatch. */
export async function demoRequest<T>(method: Method, rawPath: string, body?: unknown): Promise<T> {
  await delay();
  const [path, query = ''] = rawPath.split('?');
  const qs = new URLSearchParams(query);
  return (await dispatch(method, path, qs, body as Body)) as T;
}

/** Entry point untuk apiGetText (mis. ekspor CSV laporan). */
export async function demoRequestText(rawPath: string): Promise<string> {
  await delay();
  const [path] = rawPath.split('?');
  const seg = path.split('/').filter(Boolean);
  if (seg[0] === 'reports' && seg[2] === 'export') {
    return toCsv(reportRows(seg[1]));
  }
  return notFound('GET', path);
}
