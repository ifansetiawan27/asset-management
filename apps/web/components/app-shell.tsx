'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { Icon, IconName } from './icons';
import { cn } from './ui';
import { getUser, logout, SessionUser } from '@/lib/auth';
import { NAV } from '@/lib/nav';

/* ── Nav item ───────────────────────────────────────────── */
function NavLink({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/30'
          : 'text-slate-400 hover:bg-sidebar-surface hover:text-slate-100',
      )}
    >
      {/* Active left accent bar */}
      {active && (
        <span className="absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-white/60" />
      )}
      <Icon
        name={icon}
        width={17}
        height={17}
        className={cn(
          'shrink-0 transition-colors',
          active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300',
        )}
      />
      <span className="truncate leading-none">{label}</span>
    </Link>
  );
}

/* ── AppShell ────────────────────────────────────────────── */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname  = usePathname();
  const isActive  = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const [user, setUser]       = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const displayName  = user?.username ?? user?.email ?? 'User';
  const displayRole  = user?.roles?.[0] ?? '—';
  const initials     = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  /* Shared sidebar content (desktop + mobile drawer) */
  const SidebarBody = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* ── Logo / Brand ────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white shadow-lg shadow-brand-900/40 ring-1 ring-white/10">
          A
        </div>
        <div className="leading-snug">
          <p className="text-sm font-bold tracking-tight text-white">AMS</p>
          <p className="text-[10px] text-slate-500">Asset Management</p>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {/* Nav group label */}
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Menu Utama
        </p>

        {NAV.slice(0, 7).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            onClick={onNavClick}
          />
        ))}

        <div className="my-2 border-t border-sidebar-border" />
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Konfigurasi
        </p>

        {NAV.slice(7).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* ── User footer ─────────────────────────────────── */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ring-sidebar-muted">
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">{displayName}</p>
            <p className="truncate text-[10px] text-slate-500">{displayRole}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Keluar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-sidebar-surface hover:text-red-400"
          >
            {/* Logout icon */}
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Desktop sidebar ───────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar shadow-sidebar md:flex">
        <SidebarBody />
      </aside>

      {/* ── Main column ───────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ── Topbar ──────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-topbar lg:px-6">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            title="Buka menu"
            aria-label="Buka menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 md:hidden"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Icon name="search" width={15} height={15} />
            </span>
            <input
              type="search"
              placeholder="Cari aset, tiket, vendor..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">

            {/* Notification bell */}
            <button
              title="Notifikasi"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            >
              <Icon name="bell" width={17} height={17} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />
            </button>

            {/* Add asset CTA */}
            <Link
              href="/assets/new"
              className="flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
            >
              <Icon name="plus" width={15} height={15} />
              <span className="hidden sm:inline">Tambah Aset</span>
            </Link>

            {/* User chip */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="hidden text-right leading-tight lg:block">
                <p className="max-w-[144px] truncate text-xs font-semibold text-slate-700">{displayName}</p>
                <p className="text-[10px] text-slate-400">{displayRole}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white ring-2 ring-white shadow-sm">
                {initials || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* ── Mobile drawer ────────────────────────────── */}
        <div className={cn('fixed inset-0 z-40 md:hidden', menuOpen ? '' : 'pointer-events-none')}>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            className={cn(
              'absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200',
              menuOpen ? 'opacity-100' : 'opacity-0',
            )}
          />
          {/* Drawer */}
          <aside
            className={cn(
              'absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar shadow-2xl transition-transform duration-300',
              menuOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sidebar-surface hover:text-white"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <SidebarBody onNavClick={() => setMenuOpen(false)} />
          </aside>
        </div>

        {/* ── Page content ─────────────────────────────── */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
