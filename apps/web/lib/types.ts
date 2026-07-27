export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Category {
  id: string;
  code: string;
  name: string;
  defaultUsefulLifeYears: number | null;
  defaultDepreciationMethod: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  categoryId: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  assetType?: string | null;
  status: string;
  purchasePrice?: number | null;
  bookValue?: number | null;
  currency: string;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  usefulLifeYears?: number | null;
  depreciationMethod?: string;
  vendorId?: string | null;
  locationId?: string | null;
  departmentId?: string | null;
  custodianUserId?: string | null;
  qrUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DashboardSummary {
  assetSummary: { total: number; byStatus: Record<string, number> };
  assetValue: { totalPurchase: number; totalBookValue: number; totalDepreciation: number };
  maintenance: { openTickets: number; completedTickets: number; dueToday: number; overdue: number };
  audit: { totalSessions: number; inProgressSessions: number; byStatus: Record<string, number> };
  generatedAt: string;
}

export interface AssetDocument {
  id: string;
  docType: string;
  fileName?: string | null;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface DepreciationEntry {
  id: string;
  periodYear: number;
  periodMonth: number;
  depreciationAmount: number;
  accumulated: number;
  bookValue: number;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  mfaEnabled: boolean;
  roles: Array<{ code: string; name: string }>;
  createdAt: string;
}

export interface Ticket {
  id: string;
  assetId: string;
  problem: string;
  severity: string;
  status: string;
  type: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  assetId: string;
  ticketId?: string | null;
  status: string;
  maintenanceType: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
  createdAt: string;
}

export interface AuditSession {
  id: string;
  name: string;
  status: string;
  startedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
}

export interface Disposal {
  id: string;
  assetId: string;
  reason: string;
  status: string;
  saleValue?: number | null;
  disposedAt?: string | null;
  createdAt: string;
}

export interface ApprovalReq {
  id: string;
  entityType: string;
  entityId: string;
  approverRole: string;
  status: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  planCode: string;
  status: string;
  seats: number;
  assetQuota: number;
  currentPeriodStart?: string | null;
}

export interface UsageSummary {
  plan: string | null;
  status: string | null;
  assets: { used: number; quota: number | null };
  users: { used: number; seats: number | null };
}
