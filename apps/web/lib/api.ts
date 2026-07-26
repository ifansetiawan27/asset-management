export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002/api/v1';
export const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID ?? '11111111-1111-1111-1111-111111111111';

function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
  };
}

async function handle<T>(res: Response): Promise<T> {
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
  return fetch(`${API_BASE}${path}`, {
    headers: buildHeaders(),
    cache: 'no-store',
  }).then((r) => handle<T>(r));
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

/** Ambil respons teks (mis. CSV) dengan header tenant. */
export async function apiGetText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'X-Tenant-ID': TENANT_ID },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}
