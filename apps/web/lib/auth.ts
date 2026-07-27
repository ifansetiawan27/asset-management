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

export async function login(username: string, password: string): Promise<void> {
  if (isDemo()) {
    const token = demoLogin(username, password);
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    let message = 'Login gagal';
    try {
      const j = await res.json();
      message = j?.error?.message ?? j?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const json = (await res.json()) as { accessToken: string };
  window.localStorage.setItem(TOKEN_KEY, json.accessToken);
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }
}
