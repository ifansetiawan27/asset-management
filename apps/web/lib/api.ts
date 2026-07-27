import { isDemo } from './demo/config';
import { demoRequest, demoRequestText } from './demo/router';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002/api/v1';

const TOKEN_KEY = 'ams_token';

function getToken(): string | null {
  return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
}

function buildHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
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

export async function apiGetText(path: string): Promise<string> {
  if (isDemo()) return demoRequestText(path);
  const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders(false), cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}
