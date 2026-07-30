import { API_BASE } from './api';
import { demoLogin, isDemo } from './demo/config';

export const TOKEN_KEY = 'ams_token';

export interface SessionUser {
  sub: string;
  email: string | null;
  username: string | null;
  tenantId: string | null;
  roles: string[];
}

function b64urlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const bin = atob(s);
  try {
    return decodeURIComponent(
      bin
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return bin;
  }
}

function decode(token: string): SessionUser | null {
  try {
    const payload = JSON.parse(b64urlDecode(token.split('.')[1]));
    return {
      sub: payload.sub,
      email: payload.email ?? null,
      username: payload.preferred_username ?? null,
      tenantId: payload.tenant_id ?? null,
      roles: payload.realm_access?.roles ?? [],
    };
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  const t = getToken();
  return t ? decode(t) : null;
}

async function postAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<{ accessToken: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = 'Permintaan gagal';
    try {
      const j = await res.json();
      const raw = j?.error?.message ?? j?.message;
      message = Array.isArray(raw) ? raw.join(', ') : (raw ?? message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as { accessToken: string };
}

export async function login(email: string, password: string): Promise<void> {
  if (isDemo()) {
    const token = demoLogin(email, password);
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  const json = await postAuth('/auth/login', { email, password });
  window.localStorage.setItem(TOKEN_KEY, json.accessToken);
}

/** Pendaftaran akun baru (mode backend nyata). */
export async function register(
  fullName: string,
  email: string,
  password: string,
): Promise<void> {
  if (isDemo()) {
    throw new Error(
      'Pendaftaran tidak tersedia di Mode Demo. Nonaktifkan Demo Mode untuk membuat akun nyata.',
    );
  }
  const json = await postAuth('/auth/register', { fullName, email, password });
  window.localStorage.setItem(TOKEN_KEY, json.accessToken);
}

/** URL halaman landing (entry point autentikasi). Dikonfigurasi via env var. */
const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? '/landing.html';

export function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    window.location.href = LANDING_URL;
  }
}
