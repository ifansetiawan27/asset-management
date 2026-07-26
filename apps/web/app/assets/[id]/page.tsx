'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorBox,
  PageHeader,
  Spinner,
  StatusBadge,
} from '@/components/ui';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { Asset, AssetDocument, DepreciationEntry, HistoryItem } from '@/lib/types';

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [docs, setDocs] = useState<AssetDocument[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [depr, setDepr] = useState<DepreciationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiGet<Asset>(`/assets/${id}`).then(setAsset).catch((e: Error) => setError(e.message));
    apiGet<AssetDocument[]>(`/assets/${id}/documents`).then(setDocs).catch(() => undefined);
    apiGet<HistoryItem[]>(`/assets/${id}/history`).then(setHistory).catch(() => undefined);
    apiGet<DepreciationEntry[]>(`/assets/${id}/depreciation`).then(setDepr).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function activate() {
    setBusy(true);
    try {
      await apiPatch<Asset>(`/assets/${id}`, { status: 'ACTIVE' });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      await apiPost(`/assets/${id}/label`, {});
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !asset) {
    return (
      <>
        <PageHeader title="Detail Aset" />
        <ErrorBox message={error} />
      </>
    );
  }
  if (!asset) {
    return (
      <>
        <PageHeader title="Detail Aset" />
        <Spinner />
      </>
    );
  }

  const info: Array<[string, string]> = [
    ['Kode Aset', asset.assetCode],
    ['Brand', asset.brand ?? '-'],
    ['Model', asset.model ?? '-'],
    ['Serial Number', asset.serialNumber ?? '-'],
    ['Tipe', asset.assetType ?? '-'],
    ['Tanggal Beli', formatDate(asset.purchaseDate)],
    ['Harga Perolehan', formatCurrency(asset.purchasePrice, asset.currency)],
    ['Nilai Buku', formatCurrency(asset.bookValue, asset.currency)],
    ['Umur Ekonomis', asset.usefulLifeYears ? `${asset.usefulLifeYears} tahun` : '-'],
    ['Metode Penyusutan', asset.depreciationMethod ?? '-'],
  ];

  return (
    <>
      <PageHeader
        title={asset.name}
        subtitle={asset.assetCode}
        action={
          <div className="flex gap-2">
            <Link href="/assets">
              <Button variant="secondary">Kembali</Button>
            </Link>
            {asset.status === 'DRAFT' ? (
              <Button onClick={activate} disabled={busy}>
                Aktifkan
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorBox message={error} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Informasi Aset" action={<StatusBadge status={asset.status} />} />
            <CardBody>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {info.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Riwayat Aset" />
            <CardBody>
              {history.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada riwayat.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-slate-200 pl-4">
                  {history.map((h) => (
                    <li key={h.id}>
                      <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
                      <p className="text-sm font-medium text-slate-800">{h.eventType}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(h.occurredAt)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Penyusutan" />
            <CardBody>
              {depr.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada entri penyusutan.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-400">
                      <th className="pb-2">Periode</th>
                      <th className="pb-2 text-right">Penyusutan</th>
                      <th className="pb-2 text-right">Akumulasi</th>
                      <th className="pb-2 text-right">Nilai Buku</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depr.map((d) => (
                      <tr key={d.id} className="border-t border-slate-100">
                        <td className="py-2">
                          {String(d.periodMonth).padStart(2, '0')}/{d.periodYear}
                        </td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(d.depreciationAmount)}</td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(d.accumulated)}</td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(d.bookValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Label QR" action={<Button size="sm" variant="secondary" onClick={regenerate} disabled={busy}>Generate ulang</Button>} />
            <CardBody className="flex flex-col items-center">
              {asset.qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.qrUrl} alt="QR" className="h-44 w-44 rounded-lg border border-slate-200 p-2" />
              ) : (
                <p className="text-sm text-slate-400">QR belum tersedia.</p>
              )}
              <p className="mt-3 font-mono text-sm font-semibold text-slate-700">{asset.assetCode}</p>
              <p className="text-xs text-slate-400">{asset.name}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Dokumen (${docs.length})`} />
            <CardBody>
              {docs.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada dokumen.</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{d.fileName ?? d.docType}</span>
                      <span className="text-xs text-slate-400">{d.docType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
