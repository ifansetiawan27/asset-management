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
  qrUrl?: string | null;
  createdAt: string;
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
