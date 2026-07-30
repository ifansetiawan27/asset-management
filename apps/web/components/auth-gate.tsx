'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { AppShell } from './app-shell';
import { getToken } from '@/lib/auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /**
     * Tangkap token yang dikirim via URL hash dari halaman landing (file:// origin).
     * Landing page tidak bisa berbagi localStorage lintas-origin, sehingga token
     * diteruskan sebagai fragment: APP_URL/#t=<JWT>
     * Token dibaca di sini (client-side, sebelum cek auth) lalu hash dibersihkan.
     */
    const hash = window.location.hash;
    if (hash.startsWith('#t=')) {
      try {
        const token = decodeURIComponent(hash.slice(3));
        if (token) {
          window.localStorage.setItem('ams_token', token);
          // Bersihkan hash dari URL tanpa reload
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search,
          );
        }
      } catch {
        /* abaikan token tidak valid */
      }
    }
    setMounted(true);
  }, []);

  const isPublic = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (mounted && !isPublic && !getToken()) {
      router.replace('/login');
    }
  }, [mounted, isPublic, pathname, router]);

  if (isPublic) {
    return <>{children}</>;
  }
  if (!mounted || !getToken()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-400">
        Memuat...
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
