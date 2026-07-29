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
