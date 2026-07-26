import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId: string | null;
}

/**
 * Menyimpan konteks tenant per-request menggunakan AsyncLocalStorage,
 * sehingga tersedia di service/repository tanpa perlu mengalirkan
 * tenantId secara manual di setiap pemanggilan.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantId(): string | null {
  return tenantStorage.getStore()?.tenantId ?? null;
}
