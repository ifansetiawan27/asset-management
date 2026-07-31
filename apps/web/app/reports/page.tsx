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

  // Guard: normalisasi response — menerima array langsung ATAU { type, count, rows }
  const normalizedData: ReportResponse | null = !data ? null
    : Array.isArray(data)
      ? { type, count: (data as unknown[]).length, rows: data as Array<Record<string, unknown>> }
      : data;
  const columns = normalizedData && normalizedData.rows?.length > 0
    ? Object.keys(normalizedData.rows[0])
    : [];

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
                      <th key={c} className="px-4 py-3 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedData.rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      {columns.map((c) => (
                        <td key={c} className="px-4 py-2 text-slate-700">
                          {formatCell(row[c])}
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

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
