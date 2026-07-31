'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { Icon, IconName } from './icons';
import { cn } from './ui';
import { apiGet, apiPost } from '@/lib/api';
import { getUser, logout, SessionUser } from '@/lib/auth';
import { NAV } from '@/lib/nav';
import { AppNotification } from '@/lib/types';

/* ════════════════════════════════════════════════════════════
   NOTIFICATION PANEL
════════════════════════════════════════════════════════════ */
function notifStyle(type: string): { bg: string; text: string; icon: IconName } {
  const t = type?.toUpperCase() ?? '';
  if (t.includes('MAINTENANCE') || t.includes('DUE'))
    return { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'wrench' };
  if (t.includes('ALERT') || t.includes('MISSING') || t.includes('DAMAGED') || t.includes('OVERDUE'))
    return { bg: 'bg-red-50', text: 'text-red-600', icon: 'shield' };
  if (t.includes('APPROVED') || t.includes('COMPLETED'))
    return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'check' };
  if (t.includes('AUDIT'))
    return { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'clipboard' };
  if (t.includes('DISPOSAL'))
    return { bg: 'bg-red-50', text: 'text-red-600', icon: 'trash' };
  return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bell' };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return 'Baru saja';
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function NotificationPanel({
  anchorRef,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const panelRef              = useRef<HTMLDivElement>(null);
  const [items, setItems]     = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<AppNotification[]>('/notifications')
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [anchorRef, onClose]);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    setMarking(true);
    try {
      await Promise.all(
        items.filter((n) => !n.read).map((n) =>
          apiPost(`/notifications/${n.id}/read`, {}).catch(() => null),
        ),
      );
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarking(false);
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">Log Aktivitas</h3>
          {unread > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={marking}
              className="text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-50"
            >
              {marking ? 'Memproses...' : 'Tandai semua dibaca'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
            Memuat...
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-slate-500">Gagal memuat notifikasi</p>
            <p className="mt-1 text-xs text-slate-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icon name="bell" width={22} height={22} />
            </div>
            <p className="text-sm font-medium text-slate-600">Tidak ada notifikasi</p>
            <p className="mt-1 text-xs text-slate-400">Aktivitas terbaru akan muncul di sini.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map((n) => {
              const s = notifStyle(n.type);
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50',
                    !n.read && 'bg-blue-50/40 hover:bg-blue-50/60',
                  )}
                >
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', s.bg, s.text)}>
                    <Icon name={s.icon} width={15} height={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs leading-snug', n.read ? 'text-slate-600' : 'font-medium text-slate-800')}>
                      {n.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      {n.type && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                          {n.type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
          <p className="text-[11px] text-slate-400">Menampilkan {items.length} aktivitas terakhir</p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   NAV LINK  (plain — tanpa accordion)
════════════════════════════════════════════════════════════ */
function NavLink({
  href,
  label,
  icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        collapsed ? 'justify-center px-2' : '',
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/30'
          : 'text-slate-400 hover:bg-sidebar-surface hover:text-slate-100',
      )}
    >
      {active && !collapsed && (
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
      {!collapsed && <span className="truncate leading-none">{label}</span>}
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════
   APP SHELL
════════════════════════════════════════════════════════════ */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const [user, setUser]         = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setUser(getUser()); }, []);

  const displayName = user?.username ?? user?.email ?? 'User';
  const displayRole = user?.roles?.[0] ?? '—';
  const initials    = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  /* ── Sidebar content (shared desktop + mobile drawer) ── */
  const SidebarBody = ({
    isCollapsed = false,
    onNavClick,
  }: {
    isCollapsed?: boolean;
    onNavClick?: () => void;
  }) => (
    <>
      {/* ── Logo + collapse toggle ─────────────────────── */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border px-3',
          isCollapsed ? 'justify-center' : 'justify-between px-4',
        )}
      >
        {/* Brand */}
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white shadow-lg shadow-brand-900/40 ring-1 ring-white/10">
            A
          </div>
          {!isCollapsed && (
            <div className="leading-snug">
              <p className="text-sm font-bold tracking-tight text-white">AMS</p>
              <p className="text-[10px] text-slate-500">Asset Management</p>
            </div>
          )}
        </div>

        {/* Collapse toggle — hanya desktop */}
        {!onNavClick && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-sidebar-surface hover:text-slate-200',
              isCollapsed && 'mt-0',
            )}
          >
            {/* Double arrow left / right */}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isCollapsed ? (
                /* arrow right (expand) */
                <>
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </>
              ) : (
                /* arrow left (collapse) */
                <>
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav
        className={cn(
          'sidebar-scroll flex-1 space-y-0.5 overflow-y-auto py-3',
          isCollapsed ? 'px-2' : 'px-3',
        )}
      >
        {!isCollapsed && (
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Menu Utama
          </p>
        )}

        {NAV.slice(0, 7).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={isCollapsed}
            onClick={onNavClick}
          />
        ))}

        <div className="my-2 border-t border-sidebar-border" />

        {!isCollapsed && (
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Konfigurasi
          </p>
        )}

        {NAV.slice(7).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={isCollapsed}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* ── User footer ─────────────────────────────────── */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div
          className={cn(
            'flex items-center rounded-lg px-2 py-1.5',
            isCollapsed ? 'justify-center' : 'gap-3',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ring-sidebar-muted">
            {initials || 'U'}
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{displayName}</p>
                <p className="truncate text-[10px] text-slate-500">{displayRole}</p>
              </div>
              <button
                onClick={() => logout()}
                title="Keluar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-sidebar-surface hover:text-red-400"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5M21 12H9" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Desktop sidebar ───────────────────────────── */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar shadow-sidebar transition-all duration-300 md:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarBody isCollapsed={collapsed} />
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

            {/* Bell → Log Aktivitas */}
            <div className="relative">
              <button
                ref={bellRef}
                title="Log Aktivitas"
                onClick={() => setBellOpen((v) => !v)}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-lg border transition',
                  bellOpen
                    ? 'border-brand-300 bg-brand-50 text-brand-600'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                <Icon name="bell" width={17} height={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />
              </button>
              {bellOpen && (
                <NotificationPanel anchorRef={bellRef} onClose={() => setBellOpen(false)} />
              )}
            </div>

            {/* Add asset */}
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
          <div
            onClick={() => setMenuOpen(false)}
            className={cn(
              'absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200',
              menuOpen ? 'opacity-100' : 'opacity-0',
            )}
          />
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
            <SidebarBody isCollapsed={false} onNavClick={() => setMenuOpen(false)} />
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
