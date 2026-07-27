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

  const isLogin = pathname === '/login';

  useEffect(() => {
    if (mounted && !isLogin && !getToken()) {
      router.replace('/login');
    }
  }, [mounted, isLogin, pathname, router]);

  if (isLogin) {
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
