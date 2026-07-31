import { isDemo } from './demo/config';
import { demoRequest, demoRequestText } from './demo/router';

// Deteksi URL API secara otomatis:
// - Dev lokal (localhost)  → NestJS di port 3002
// - Produksi (Cloudflare)  → Pages Function pada domain yang sama (/api/v1)
// - Override via NEXT_PUBLIC_API_BASE_URL jika diperlukan
export const API_BASE = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') {
      return `${window.location.protocol}//${h}:3002/api/v1`;
    }
    // Produksi: Pages Function pada domain yang sama
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:3002/api/v1';
})();

const TOKEN_KEY = 'ams_token';

function getToken(): string | null {
  return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
}

function buildHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // Ekstrak tenantId dari JWT payload dan kirim sebagai X-Tenant-ID
    // agar TenantMiddleware NestJS dapat mengidentifikasi tenant.
    try {
      const b64 = token.split('.')[1];
      const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const pl  = JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/')));
      if (pl?.tenantId) headers['X-Tenant-ID'] = pl.tenantId;
    } catch { /* abaikan jika token malformed */ }
  }
  return headers;
}

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? '/landing.html';

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    // Redirect ke landing page (bukan /login) agar user masuk lewat modal auth
    const notLanding = !window.location.pathname.includes('landing');
    if (notLanding) {
      window.location.href = LANDING_URL;
    }
    throw new Error('Sesi berakhir, silakan login kembali.');
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      message = json?.error?.message ?? json?.message ?? message;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  if (isDemo()) return demoRequest<T>('GET', path);
  return fetch(`${API_BASE}${path}`, { headers: buildHeaders(false), cache: 'no-store' }).then((r) =>
    handle<T>(r),
  );
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (isDemo()) return demoRequest<T>('POST', path, body);
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  if (isDemo()) return demoRequest<T>('PATCH', path, body);
  return fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

export function apiDelete(path: string): Promise<void> {
  if (isDemo()) return Promise.resolve();
  return fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  }).then((r) => handle<void>(r));
}

export async function apiGetText(path: string): Promise<string> {
  if (isDemo()) return demoRequestText(path);
  const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders(false), cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}
