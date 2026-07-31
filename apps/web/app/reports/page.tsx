'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Card, EmptyState, ErrorBox, PageHeader, Select, Spinner } from '@/components/ui';
import { apiGet, apiGetText } from '@/lib/api';

const TYPES = [
  { value: 'inventory', label: 'Inventory (semua aset)' },
  { value: 'location', label: 'Per Lokasi' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'depreciation', label: 'Penyusutan' },
  { value: 'disposal', label: 'Disposal' },
];

interface ReportResponse {
  type: string;
  count: number;
  rows: Array<Record<string, unknown>>;
}

export default function ReportsPage() {
  const [type, setType] = useState('inventory');
  const [data, setData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback((t: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    apiGet<ReportResponse>(`/reports/${t}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(type);
  }, [type, load]);

  async function downloadCsv() {
    try {
      const text = await apiGetText(`/reports/${type}/export`);
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${type}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Guard: normalisasi response
  const normalizedData: ReportResponse | null = !data ? null
    : Array.isArray(data)
      ? { type, count: (data as unknown[]).length, rows: data as Array<Record<string, unknown>> }
      : data;

  // Kolom yang disembunyikan (teknis/internal, tidak perlu ditampilkan ke user)
  const HIDDEN_COLS = new Set([
    'tenant_id','tenantId','deleted_at','deletedAt',
    'qr_url','qrUrl','barcode_url','barcodeUrl',
    'password_hash','passwordHash','template_code','templateCode',
    'created_by','createdBy','updated_by','updatedBy',
  ]);

  const rawColumns = normalizedData && normalizedData.rows?.length > 0
    ? Object.keys(normalizedData.rows[0])
    : [];
  const columns = rawColumns.filter(c => !HIDDEN_COLS.has(c));

  return (
    <>
      <PageHeader
        title="Laporan"
        subtitle="Laporan aset dengan ekspor CSV"
        action={
          <Button variant="secondary" onClick={downloadCsv} disabled={!normalizedData || !normalizedData.rows?.length}>
            Unduh CSV
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-slate-600">Jenis laporan</span>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-64">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          {normalizedData ? <span className="text-sm text-slate-400">{normalizedData.count} baris</span> : null}
        </div>
      </Card>

      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Spinner /> : null}

      {normalizedData && !loading ? (
        !normalizedData.rows?.length ? (
          <EmptyState title="Tidak ada data" hint="Belum ada data untuk laporan ini." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    {columns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                        {colLabel(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedData.rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      {columns.map((c) => (
                        <td key={c} className="px-4 py-2 text-slate-700">
                          {formatCell(row[c], c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : null}
    </>
  );
}

/** Label ramah untuk nama kolom database */
const COL_LABELS: Record<string, string> = {
  id: 'ID', asset_code: 'Kode Aset', assetCode: 'Kode Aset',
  name: 'Nama', status: 'Status', brand: 'Brand', model: 'Model',
  serial_number: 'Serial Number', serialNumber: 'Serial Number',
  asset_type: 'Tipe', assetType: 'Tipe',
  category_id: 'Kategori', categoryId: 'Kategori',
  purchase_date: 'Tgl Beli', purchaseDate: 'Tgl Beli',
  purchase_price: 'Harga Beli', purchasePrice: 'Harga Beli',
  book_value: 'Nilai Buku', bookValue: 'Nilai Buku',
  useful_life_years: 'Umur Ekonomis', usefulLifeYears: 'Umur Ekonomis',
  depreciation_method: 'Metode Penyusutan', depreciationMethod: 'Metode Penyusutan',
  currency: 'Mata Uang', vendor_id: 'Vendor', vendorId: 'Vendor',
  warranty_expiry: 'Garansi', warrantyExpiry: 'Garansi',
  location_id: 'Lokasi', locationId: 'Lokasi',
  department_id: 'Departemen', departmentId: 'Departemen',
  custodian_user_id: 'Penanggung Jawab', custodianUserId: 'Penanggung Jawab',
  created_at: 'Dibuat', createdAt: 'Dibuat',
  updated_at: 'Diperbarui', updatedAt: 'Diperbarui',
};

function colLabel(col: string): string {
  if (COL_LABELS[col]) return COL_LABELS[col];
  // Konversi snake_case / camelCase → Title Case
  return col
    .replace(/_([a-z])/g, (_, c: string) => ' ' + c.toUpperCase())
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** UUID dipersingkat: tampilkan 8 karakter pertama saja */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatCell(value: unknown, col = ''): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);

  // Untuk kolom ID: tampilkan singkat
  if ((col === 'id' || col.endsWith('_id') || col.endsWith('Id')) && UUID_RE.test(s)) {
    return s.slice(0, 8) + '…';
  }

  // Untuk tanggal: format lokal
  if ((col.includes('date') || col.includes('Date') || col.includes('at') || col.includes('At') || col.includes('expiry')) && s.match(/^\d{4}-\d{2}-\d{2}/)) {
    try {
      return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { /* ignore */ }
  }

  // Untuk harga: format Rupiah
  if ((col.includes('price') || col.includes('Price') || col.includes('value') || col.includes('Value') || col.includes('cost') || col.includes('Cost')) && !isNaN(Number(s))) {
    return Number(s).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  }

  return s;
}
