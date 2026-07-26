'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button, Card, EmptyState, ErrorBox, Input, PageHeader, Select, Spinner, StatusBadge } from '@/components/ui';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Asset, Paginated } from '@/lib/types';

const STATUSES = ['', 'DRAFT', 'ACTIVE', 'IN_MAINTENANCE', 'BORROWED', 'UNDER_REVIEW', 'RETIRED', 'DISPOSED'];

export default function AssetsPage() {
  const [result, setResult] = useState<Paginated<Asset> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    apiGet<Paginated<Asset>>(`/assets?${params.toString()}`)
      .then(setResult)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, q, status]);

  useEffect(() => {
    load();
  }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = result?.meta;

  return (
    <>
      <PageHeader
        title="Aset"
        subtitle="Daftar seluruh aset perusahaan"
        action={
          <Link href="/assets/new">
            <Button>+ Tambah Aset</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Cari nama / kode / serial..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  load();
                }
              }}
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-48"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === '' ? 'Semua status' : s}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Cari
          </Button>
        </div>
      </Card>

      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Spinner /> : null}

      {result && !loading ? (
        result.data.length === 0 ? (
          <EmptyState title="Belum ada aset" hint="Klik 'Tambah Aset' untuk membuat aset pertama." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Kode</th>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Nilai Buku</th>
                    <th className="px-4 py-3 font-medium">Dibuat</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.assetCode}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(a.bookValue, a.currency)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/assets/${a.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                <span>
                  Halaman {meta.page} dari {meta.totalPages || 1} · {meta.total} aset
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        )
      ) : null}
    </>
  );
}
