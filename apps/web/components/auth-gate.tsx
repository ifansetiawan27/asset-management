'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { AppShell } from './app-shell';
import { getToken } from '@/lib/auth';

/** URL landing page — entry point untuk login/daftar. */
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? '/landing.html';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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

  // Rute yang boleh diakses tanpa token (fallback Next.js pages)
  const isPublic = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!mounted) return;
    if (!isPublic && !getToken()) {
      // Arahkan ke landing page (bukan /login Next.js)
      window.location.href = LANDING_URL;
    }
  }, [mounted, isPublic, pathname]);

  if (isPublic) {
    return <>{children}</>;
  }
  if (!mounted || !getToken()) {
    return (
      // suppressHydrationWarning: ekstensi browser (mis. Microsoft Translator)
      // bisa menambah atribut msttexthash ke elemen ini dan menyebabkan
      // hydration mismatch. Suppress hanya pada elemen pembungkus ini.
      <div
        suppressHydrationWarning
        className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-400"
      >
        Memuat...
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
