'use client';

import { useEffect, useState } from 'react';

import { Badge, Card, CardBody, CardHeader, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { DashboardSummary } from '@/lib/types';

function StatCard({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {caption ? <p className="mt-1 text-xs text-slate-400">{caption}</p> : null}
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardSummary>('/dashboard/summary')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Ringkasan KPI aset perusahaan" />
      {error ? <ErrorBox message={error} /> : null}
      {!data && !error ? <Spinner /> : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Aset" value={String(data.assetSummary.total)} />
            <StatCard label="Aktif" value={String(data.assetSummary.byStatus.ACTIVE ?? 0)} />
            <StatCard label="Dipinjam" value={String(data.assetSummary.byStatus.BORROWED ?? 0)} />
            <StatCard label="Dalam Perbaikan" value={String(data.assetSummary.byStatus.IN_MAINTENANCE ?? 0)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard label="Nilai Perolehan" value={formatCurrency(data.assetValue.totalPurchase)} />
            <StatCard label="Nilai Buku" value={formatCurrency(data.assetValue.totalBookValue)} />
            <StatCard label="Akumulasi Penyusutan" value={formatCurrency(data.assetValue.totalDepreciation)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Maintenance" />
              <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniStat label="Tiket Terbuka" value={data.maintenance.openTickets} />
                <MiniStat label="Selesai" value={data.maintenance.completedTickets} />
                <MiniStat label="Jatuh Tempo" value={data.maintenance.dueToday} />
                <MiniStat label="Terlambat" value={data.maintenance.overdue} tone="red" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Audit" />
              <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniStat label="Sesi" value={data.audit.totalSessions} />
                <MiniStat label="Berjalan" value={data.audit.inProgressSessions} />
                <MiniStat label="Hilang" value={data.audit.byStatus.MISSING ?? 0} tone="red" />
                <MiniStat label="Rusak" value={data.audit.byStatus.DAMAGED ?? 0} tone="amber" />
              </CardBody>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge color="green">API terhubung</Badge>
            <span className="text-xs text-slate-400">Diperbarui: {formatDateTime(data.generatedAt)}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: 'red' | 'amber' }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900';
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
