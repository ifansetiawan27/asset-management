'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icons';
import {
  Card,
  CardBody,
  CardHeader,
  ConditionCard,
  ErrorBox,
  PageHeader,
  Spinner,
  StatCard,
} from '@/components/ui';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { DashboardSummary } from '@/lib/types';

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
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan kondisi & nilai aset perusahaan"
        action={
          <Link
            href="/assets"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Lihat semua aset
          </Link>
        }
      />

      {error ? <ErrorBox message={error} /> : null}
      {!data && !error ? <Spinner /> : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Aset" value={data.assetSummary.total} tone="violet" icon={<Icon name="box" />} />
            <StatCard label="Aktif" value={data.assetSummary.byStatus.ACTIVE ?? 0} tone="green" icon={<Icon name="check" />} />
            <StatCard label="Dipinjam" value={data.assetSummary.byStatus.BORROWED ?? 0} tone="blue" icon={<Icon name="user" />} />
            <StatCard label="Perbaikan" value={data.assetSummary.byStatus.IN_MAINTENANCE ?? 0} tone="amber" icon={<Icon name="wrench" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard label="Nilai Perolehan" value={formatCurrency(data.assetValue.totalPurchase)} tone="blue" icon={<Icon name="money" />} />
            <StatCard label="Nilai Buku" value={formatCurrency(data.assetValue.totalBookValue)} tone="green" icon={<Icon name="money" />} />
            <StatCard label="Akumulasi Penyusutan" value={formatCurrency(data.assetValue.totalDepreciation)} tone="amber" icon={<Icon name="report" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Maintenance" />
              <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <ConditionCard title={`${data.maintenance.openTickets} Tiket Terbuka`} subtitle="Menunggu penanganan" tone={data.maintenance.openTickets > 0 ? 'amber' : 'green'} icon={<Icon name="wrench" />} />
                <ConditionCard title={`${data.maintenance.completedTickets} Selesai`} subtitle="Tiket terselesaikan" tone="green" icon={<Icon name="check" />} />
                <ConditionCard title={`${data.maintenance.dueToday} Jatuh Tempo`} subtitle="Preventive hari ini" tone={data.maintenance.dueToday > 0 ? 'blue' : 'slate'} icon={<Icon name="clipboard" />} />
                <ConditionCard title={`${data.maintenance.overdue} Terlambat`} subtitle="Preventive lewat jadwal" tone={data.maintenance.overdue > 0 ? 'red' : 'green'} icon={<Icon name="activity" />} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Audit" />
              <CardBody className="grid grid-cols-2 gap-3">
                <ConditionCard title={`${data.audit.totalSessions} Sesi`} subtitle="Total sesi audit" tone="slate" icon={<Icon name="clipboard" />} />
                <ConditionCard title={`${data.audit.inProgressSessions} Berjalan`} subtitle="Sesi in-progress" tone="blue" icon={<Icon name="activity" />} />
                <ConditionCard title={`${data.audit.byStatus.MISSING ?? 0} Hilang`} subtitle="Item MISSING" tone={(data.audit.byStatus.MISSING ?? 0) > 0 ? 'red' : 'green'} icon={<Icon name="shield" />} />
                <ConditionCard title={`${data.audit.byStatus.DAMAGED ?? 0} Rusak`} subtitle="Item DAMAGED" tone={(data.audit.byStatus.DAMAGED ?? 0) > 0 ? 'amber' : 'green'} icon={<Icon name="wrench" />} />
              </CardBody>
            </Card>
          </div>

          <p className="text-xs text-slate-400">Diperbarui: {formatDateTime(data.generatedAt)}</p>
        </div>
      ) : null}
    </>
  );
}
