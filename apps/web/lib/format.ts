export function formatCurrency(value?: number | null, currency = 'IDR'): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
