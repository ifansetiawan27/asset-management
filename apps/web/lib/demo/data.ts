/**
 * Data mock in-memory untuk Demo Mode.
 * State bertahan selama sesi SPA (reset saat halaman di-reload penuh).
 */
import {
  AppUser,
  ApprovalReq,
  Asset,
  AssetDocument,
  AuditSession,
  Category,
  DepreciationEntry,
  Disposal,
  HistoryItem,
  Subscription,
  Ticket,
  Vendor,
} from '../types';
import { DEMO_ACCOUNTS } from './config';

const NOW = Date.now();
export const daysAgo = (n: number): string => new Date(NOW - n * 86_400_000).toISOString();

const ROLE_NAMES: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ASSET_ADMINISTRATOR: 'Asset Administrator',
  PROCUREMENT: 'Procurement',
  TECHNICIAN: 'Teknisi',
  AUDITOR: 'Auditor',
  DEPARTMENT_MANAGER: 'Department Manager',
  EMPLOYEE: 'Employee',
};

export interface DemoStore {
  categories: Category[];
  vendors: Vendor[];
  assets: Asset[];
  users: AppUser[];
  tickets: Ticket[];
  auditSessions: AuditSession[];
  disposals: Disposal[];
  approvals: ApprovalReq[];
  subscription: Subscription;
  schedulesDueToday: number;
  schedulesOverdue: number;
  auditItemsByStatus: Record<string, number>;
  counters: Record<string, number>;
}

function makeAsset(
  p: Partial<Asset> &
    Pick<Asset, 'id' | 'assetCode' | 'name' | 'categoryId' | 'status' | 'purchasePrice' | 'bookValue'>,
): Asset {
  return {
    currency: 'IDR',
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 4,
    brand: null,
    model: null,
    serialNumber: null,
    assetType: null,
    purchaseDate: daysAgo(240),
    warrantyExpiry: daysAgo(-360),
    vendorId: null,
    locationId: null,
    departmentId: null,
    custodianUserId: null,
    qrUrl: null,
    createdAt: daysAgo(200),
    updatedAt: daysAgo(12),
    ...p,
  };
}

function seed(): DemoStore {
  const categories: Category[] = [
    { id: 'cat-it', code: 'IT', name: 'IT Equipment', defaultUsefulLifeYears: 4, defaultDepreciationMethod: 'STRAIGHT_LINE' },
    { id: 'cat-furn', code: 'FURN', name: 'Furnitur', defaultUsefulLifeYears: 8, defaultDepreciationMethod: 'STRAIGHT_LINE' },
    { id: 'cat-veh', code: 'VEH', name: 'Kendaraan', defaultUsefulLifeYears: 8, defaultDepreciationMethod: 'DECLINING_BALANCE' },
    { id: 'cat-fac', code: 'FAC', name: 'Fasilitas', defaultUsefulLifeYears: 10, defaultDepreciationMethod: 'STRAIGHT_LINE' },
  ];

  const vendors: Vendor[] = [
    { id: 'ven-1', code: 'VDR-001', name: 'PT Sumber Jaya Komputer', contact: 'Budi Santoso', email: 'sales@sumberjaya.co.id', phone: '021-555-1001' },
    { id: 'ven-2', code: 'VDR-002', name: 'CV Mitra Furnitur', contact: 'Siti Aminah', email: 'cs@mitrafurnitur.co.id', phone: '021-555-2002' },
    { id: 'ven-3', code: 'VDR-003', name: 'PT Auto Prima', contact: 'Andi Wijaya', email: 'andi@autoprima.co.id', phone: '021-555-3003' },
  ];

  const assets: Asset[] = [
    makeAsset({ id: 'ast-1', assetCode: 'AMS-IT-0001', name: 'Laptop Dell Latitude 5440', categoryId: 'cat-it', status: 'ACTIVE', purchasePrice: 18_000_000, bookValue: 13_500_000, brand: 'Dell', model: 'Latitude 5440', serialNumber: 'SN-DL5440-001', assetType: 'IT Equipment', vendorId: 'ven-1', locationId: 'LOC-JKT-01', custodianUserId: 'usr-employee' }),
    makeAsset({ id: 'ast-2', assetCode: 'AMS-IT-0002', name: 'MacBook Pro 14 M3', categoryId: 'cat-it', status: 'ACTIVE', purchasePrice: 32_000_000, bookValue: 27_200_000, brand: 'Apple', model: 'MacBook Pro 14', serialNumber: 'SN-MBP14-002', assetType: 'IT Equipment', vendorId: 'ven-1', locationId: 'LOC-JKT-01' }),
    makeAsset({ id: 'ast-3', assetCode: 'AMS-IT-0003', name: 'Printer HP LaserJet Pro', categoryId: 'cat-it', status: 'IN_MAINTENANCE', purchasePrice: 4_500_000, bookValue: 2_700_000, brand: 'HP', model: 'LaserJet Pro M404', serialNumber: 'SN-HP404-003', assetType: 'IT Equipment', vendorId: 'ven-1', locationId: 'LOC-JKT-02' }),
    makeAsset({ id: 'ast-4', assetCode: 'AMS-FUR-0001', name: 'Meja Kerja Ergonomis', categoryId: 'cat-furn', status: 'ACTIVE', purchasePrice: 2_500_000, bookValue: 1_800_000, usefulLifeYears: 8, brand: 'Ikea', vendorId: 'ven-2', locationId: 'LOC-JKT-02' }),
    makeAsset({ id: 'ast-5', assetCode: 'AMS-FUR-0002', name: 'Kursi Kantor Executive', categoryId: 'cat-furn', status: 'ACTIVE', purchasePrice: 1_800_000, bookValue: 1_300_000, usefulLifeYears: 8, vendorId: 'ven-2', locationId: 'LOC-JKT-02' }),
    makeAsset({ id: 'ast-6', assetCode: 'AMS-VEH-0001', name: 'Toyota Avanza 2023', categoryId: 'cat-veh', status: 'BORROWED', purchasePrice: 245_000_000, bookValue: 210_000_000, usefulLifeYears: 8, depreciationMethod: 'DECLINING_BALANCE', brand: 'Toyota', model: 'Avanza G', serialNumber: 'B-1234-XYZ', assetType: 'Kendaraan', vendorId: 'ven-3', locationId: 'LOC-JKT-GRG' }),
    makeAsset({ id: 'ast-7', assetCode: 'AMS-IT-0004', name: 'Proyektor Epson EB-X51', categoryId: 'cat-it', status: 'ACTIVE', purchasePrice: 6_500_000, bookValue: 4_800_000, brand: 'Epson', model: 'EB-X51', vendorId: 'ven-1', locationId: 'LOC-JKT-03' }),
    makeAsset({ id: 'ast-8', assetCode: 'AMS-FAC-0001', name: 'AC Daikin 1.5PK', categoryId: 'cat-fac', status: 'ACTIVE', purchasePrice: 5_200_000, bookValue: 3_900_000, usefulLifeYears: 10, brand: 'Daikin', vendorId: 'ven-2', locationId: 'LOC-JKT-03' }),
    makeAsset({ id: 'ast-9', assetCode: 'AMS-IT-0005', name: 'Server Dell PowerEdge R750', categoryId: 'cat-it', status: 'UNDER_REVIEW', purchasePrice: 85_000_000, bookValue: 68_000_000, brand: 'Dell', model: 'PowerEdge R750', serialNumber: 'SN-PER750-009', assetType: 'Server', vendorId: 'ven-1', locationId: 'LOC-JKT-DC' }),
    makeAsset({ id: 'ast-10', assetCode: 'AMS-FAC-0002', name: 'Genset Diesel 10kVA', categoryId: 'cat-fac', status: 'RETIRED', purchasePrice: 55_000_000, bookValue: 11_000_000, usefulLifeYears: 10, brand: 'Cummins', vendorId: 'ven-3', locationId: 'LOC-JKT-GRG', createdAt: daysAgo(900) }),
    makeAsset({ id: 'ast-11', assetCode: 'AMS-IT-0006', name: 'Router Mikrotik CCR2004', categoryId: 'cat-it', status: 'ACTIVE', purchasePrice: 9_800_000, bookValue: 7_600_000, brand: 'Mikrotik', model: 'CCR2004', vendorId: 'ven-1', locationId: 'LOC-JKT-DC' }),
    makeAsset({ id: 'ast-12', assetCode: 'AMS-FAC-0003', name: 'CCTV Hikvision 8CH', categoryId: 'cat-fac', status: 'DRAFT', purchasePrice: 7_200_000, bookValue: 7_200_000, usefulLifeYears: 10, brand: 'Hikvision', vendorId: 'ven-2', locationId: 'LOC-JKT-03', createdAt: daysAgo(3), updatedAt: daysAgo(3) }),
  ];

  const users: AppUser[] = DEMO_ACCOUNTS.map((a, i) => ({
    id: `usr-${a.roles[0].toLowerCase()}`,
    email: a.email,
    fullName: a.fullName,
    status: 'ACTIVE',
    mfaEnabled: i === 0,
    roles: a.roles.map((code) => ({ code, name: ROLE_NAMES[code] ?? code })),
    createdAt: daysAgo(300 - i * 10),
  }));

  const tickets: Ticket[] = [
    { id: 'tkt-1', assetId: 'ast-3', problem: 'Printer sering paper jam saat cetak dupleks', severity: 'HIGH', status: 'IN_PROGRESS', type: 'CORRECTIVE', createdAt: daysAgo(5) },
    { id: 'tkt-2', assetId: 'ast-8', problem: 'AC tidak dingin, kemungkinan freon habis', severity: 'MEDIUM', status: 'OPEN', type: 'CORRECTIVE', createdAt: daysAgo(2) },
    { id: 'tkt-3', assetId: 'ast-1', problem: 'Beberapa tombol keyboard tidak berfungsi', severity: 'LOW', status: 'COMPLETED', type: 'CORRECTIVE', createdAt: daysAgo(20) },
    { id: 'tkt-4', assetId: 'ast-6', problem: 'Servis berkala 40.000 km', severity: 'MEDIUM', status: 'OPEN', type: 'PREVENTIVE', createdAt: daysAgo(1) },
  ];

  const auditSessions: AuditSession[] = [
    { id: 'aud-1', name: 'Audit Q1 2026 — Kantor Pusat', status: 'IN_PROGRESS', startedAt: daysAgo(3), closedAt: null, createdAt: daysAgo(4) },
    { id: 'aud-2', name: 'Audit Gudang 2026', status: 'PLANNED', startedAt: null, closedAt: null, createdAt: daysAgo(1) },
    { id: 'aud-3', name: 'Audit Tahunan 2025', status: 'CLOSED', startedAt: daysAgo(120), closedAt: daysAgo(110), createdAt: daysAgo(130) },
  ];

  const disposals: Disposal[] = [
    { id: 'dsp-1', assetId: 'ast-10', reason: 'EXPIRED', status: 'UNDER_REVIEW', saleValue: null, disposedAt: null, createdAt: daysAgo(7) },
    { id: 'dsp-2', assetId: 'ast-legacy-01', reason: 'SOLD', status: 'DISPOSED', saleValue: 750_000, disposedAt: daysAgo(25), createdAt: daysAgo(40) },
  ];

  const approvals: ApprovalReq[] = [
    { id: 'apr-1', entityType: 'ASSET_BORROWING', entityId: 'brw-1001', approverRole: 'DEPARTMENT_MANAGER', status: 'REQUESTED', createdAt: daysAgo(2) },
    { id: 'apr-2', entityType: 'ASSET_DISPOSAL', entityId: 'dsp-1', approverRole: 'DEPARTMENT_MANAGER', status: 'REQUESTED', createdAt: daysAgo(1) },
    { id: 'apr-3', entityType: 'ASSET_TRANSFER', entityId: 'trf-2001', approverRole: 'ASSET_ADMINISTRATOR', status: 'REQUESTED', createdAt: daysAgo(1) },
  ];

  const subscription: Subscription = {
    id: 'sub-1',
    planCode: 'BUSINESS',
    status: 'ACTIVE',
    seats: 25,
    assetQuota: 500,
    currentPeriodStart: daysAgo(15),
  };

  return {
    categories,
    vendors,
    assets,
    users,
    tickets,
    auditSessions,
    disposals,
    approvals,
    subscription,
    schedulesDueToday: 2,
    schedulesOverdue: 1,
    auditItemsByStatus: { FOUND: 38, MISSING: 1, DAMAGED: 2, RELOCATED: 3 },
    counters: { asset: 12, category: 4, vendor: 3, ticket: 4, audit: 3, disposal: 2 },
  };
}

/** Singleton store (bertahan selama modul dimuat). */
export const store: DemoStore = seed();

export function nextId(kind: string, prefix: string): string {
  store.counters[kind] = (store.counters[kind] ?? 0) + 1;
  return `${prefix}-${store.counters[kind]}`;
}

/* ----------------- Generator sub-resource per aset ----------------- */

export function genDocuments(asset: Asset): AssetDocument[] {
  const docs: AssetDocument[] = [
    { id: `${asset.id}-doc-1`, docType: 'INVOICE', fileName: `invoice-${asset.assetCode}.pdf`, createdAt: asset.createdAt },
  ];
  if (asset.warrantyExpiry) {
    docs.push({ id: `${asset.id}-doc-2`, docType: 'WARRANTY', fileName: `garansi-${asset.assetCode}.pdf`, createdAt: asset.createdAt });
  }
  return docs;
}

export function genHistory(asset: Asset): HistoryItem[] {
  const items: HistoryItem[] = [
    { id: `${asset.id}-h1`, eventType: 'CREATED', occurredAt: asset.createdAt, payload: { by: 'procurement@demo.local' } },
  ];
  if (asset.status !== 'DRAFT') {
    items.push({ id: `${asset.id}-h2`, eventType: 'ACTIVATED', occurredAt: daysAgo(150), payload: { status: 'ACTIVE' } });
    items.push({ id: `${asset.id}-h3`, eventType: 'LABEL_GENERATED', occurredAt: daysAgo(148), payload: { format: 'QR' } });
  }
  if (asset.status === 'BORROWED') {
    items.push({ id: `${asset.id}-h4`, eventType: 'BORROWED', occurredAt: daysAgo(10), payload: { by: 'employee@demo.local' } });
  }
  if (asset.status === 'IN_MAINTENANCE') {
    items.push({ id: `${asset.id}-h4`, eventType: 'MAINTENANCE_STARTED', occurredAt: daysAgo(5), payload: { ticket: 'tkt-1' } });
  }
  return items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

export function genDepreciation(asset: Asset): DepreciationEntry[] {
  const price = asset.purchasePrice ?? 0;
  const years = asset.usefulLifeYears ?? 4;
  if (!price || !years) return [];
  const monthly = Math.round(price / (years * 12));
  const rows: DepreciationEntry[] = [];
  const start = new Date(asset.purchaseDate ?? asset.createdAt);
  let accumulated = 0;
  for (let i = 1; i <= 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    accumulated += monthly;
    const bookValue = Math.max(price - accumulated, 0);
    rows.push({
      id: `${asset.id}-dep-${i}`,
      periodYear: d.getFullYear(),
      periodMonth: d.getMonth() + 1,
      depreciationAmount: monthly,
      accumulated,
      bookValue,
    });
    if (bookValue <= 0) break;
  }
  return rows;
}

export function genMaintHistory(asset: Asset): Array<{ id: string; type: string; cost: number | null; performedAt: string }> {
  const related = store.tickets.filter((t) => t.assetId === asset.id);
  const rows = related.map((t, i) => ({
    id: `${asset.id}-mh-${i + 1}`,
    type: t.type,
    cost: t.status === 'COMPLETED' ? 250_000 * (i + 1) : null,
    performedAt: t.createdAt,
  }));
  if (asset.status === 'ACTIVE' && rows.length === 0) {
    rows.push({ id: `${asset.id}-mh-1`, type: 'PREVENTIVE', cost: 150_000, performedAt: daysAgo(60) });
  }
  return rows;
}
