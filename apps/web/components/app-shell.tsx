'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { Icon } from './icons';
import { cn } from './ui';
import { getUser, logout, SessionUser } from '@/lib/auth';
import { NAV } from '@/lib/nav';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setUser(getUser());
  }, []);
  const displayName = user?.username ?? user?.email ?? 'User';
  const displayRole = user?.roles?.[0] ?? '—';
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar rail */}
      <aside className="sticky top-0 hidden h-screen w-24 shrink-0 flex-col bg-gradient-to-b from-indigo-800 via-indigo-900 to-purple-900 md:flex">
        <div className="flex h-16 items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white ring-1 ring-white/20">
            A
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'group flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition',
                  active ? 'bg-white/15 text-white shadow-inner' : 'text-indigo-200/80 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon name={item.icon} width={22} height={22} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-3 pt-1 text-center text-[9px] leading-tight text-indigo-300/60">
          AMS · SaaS
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            title="Buka menu"
            aria-label="Buka menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Icon name="search" />
            </div>
            <input
              placeholder="Cari aset, tiket, atau apa saja..."
              className="h-11 w-full max-w-2xl rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm transition hover:bg-blue-600 sm:flex" title="Notifikasi">
              <Icon name="bell" width={18} height={18} />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white shadow-sm transition hover:bg-violet-600 sm:flex" title="Tag">
              <Icon name="tag" width={18} height={18} />
            </button>
            <Link
              href="/assets/new"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              title="Tambah aset"
            >
              <Icon name="plus" width={18} height={18} />
              <span className="hidden sm:inline">Baru</span>
            </Link>
            <div className="ml-1 flex items-center gap-2">
              <span className="hidden text-right text-xs leading-tight lg:block">
                <span className="block max-w-[160px] truncate font-semibold text-slate-700">{displayName}</span>
                <span className="block text-slate-400">{displayRole}</span>
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-sm font-bold text-white ring-2 ring-white">
                {initials || 'U'}
              </div>
              <button
                onClick={() => logout()}
                title="Keluar"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile drawer (buka/tutup) */}
        <div className={cn('fixed inset-0 z-40 md:hidden', menuOpen ? '' : 'pointer-events-none')}>
          <div
            onClick={() => setMenuOpen(false)}
            className={cn('absolute inset-0 bg-slate-900/50 transition-opacity', menuOpen ? 'opacity-100' : 'opacity-0')}
          />
          <aside
            className={cn(
              'absolute left-0 top-0 flex h-full w-64 flex-col bg-gradient-to-b from-indigo-800 via-indigo-900 to-purple-900 shadow-xl transition-transform duration-200',
              menuOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-black ring-1 ring-white/20">A</div>
                <span className="font-bold">AMS</span>
              </div>
              <button onClick={() => setMenuOpen(false)} aria-label="Tutup menu" className="text-indigo-200 transition hover:text-white">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive(item.href) ? 'bg-white/15 text-white' : 'text-indigo-200/80 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon name={item.icon} width={20} height={20} />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-4 text-[11px] text-indigo-300/60">AMS · Multi-Tenant SaaS</div>
          </aside>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
