import { IconName } from '@/components/icons';

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Sub-menu items (accordion) */
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    href: '/assets',
    label: 'Aset',
    icon: 'box',
    children: [
      { href: '/assets',     label: 'Daftar Aset' },
      { href: '/assets/new', label: 'Tambah Aset' },
    ],
  },
  {
    href: '/maintenance',
    label: 'Maintenance',
    icon: 'wrench',
    children: [
      { href: '/maintenance',         label: 'Tiket Kerusakan' },
    ],
  },
  {
    href: '/audit',
    label: 'Audit',
    icon: 'clipboard',
    children: [
      { href: '/audit', label: 'Sesi Audit' },
    ],
  },
  {
    href: '/disposal',
    label: 'Disposal',
    icon: 'trash',
    children: [
      { href: '/disposal', label: 'Daftar Disposal' },
    ],
  },
  {
    href: '/approvals',
    label: 'Approval',
    icon: 'check',
    children: [
      { href: '/approvals', label: 'Antrian Approval' },
    ],
  },
  {
    href: '/reports',
    label: 'Laporan',
    icon: 'report',
    children: [
      { href: '/reports', label: 'Download Laporan' },
    ],
  },
  // ── Konfigurasi ──────────────────────────────────────────
  { href: '/categories', label: 'Kategori', icon: 'tag' },
  { href: '/vendors',    label: 'Vendor',   icon: 'building' },
  { href: '/users',      label: 'Pengguna', icon: 'users' },
  { href: '/billing',    label: 'Billing',  icon: 'card' },
];
