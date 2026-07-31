import { IconName } from '@/components/icons';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV: NavItem[] = [
  { href: '/',            label: 'Dashboard', icon: 'dashboard' },
  { href: '/assets',      label: 'Aset',       icon: 'box' },
  { href: '/maintenance', label: 'Maintenance', icon: 'wrench' },
  { href: '/audit',       label: 'Audit',       icon: 'clipboard' },
  { href: '/disposal',    label: 'Disposal',    icon: 'trash' },
  { href: '/approvals',   label: 'Approval',    icon: 'check' },
  { href: '/reports',     label: 'Laporan',     icon: 'report' },
  { href: '/categories',  label: 'Kategori',    icon: 'tag' },
  { href: '/vendors',     label: 'Vendor',      icon: 'building' },
  { href: '/users',       label: 'Pengguna',    icon: 'users' },
  { href: '/billing',     label: 'Billing',     icon: 'card' },
];
