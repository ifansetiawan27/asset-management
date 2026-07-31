'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/icons';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConditionCard,
  ErrorBox,
  InfoChip,
  KeyValue,
  Spinner,
  StatusBadge,
  Tabs,
} from '@/components/ui';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { Asset, AssetDocument, Category, DepreciationEntry, HistoryItem } from '@/lib/types';

interface MaintHistory {
  id: string;
  type: string;
  cost: number | null;
  performedAt: string;
}

const TABS = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'dokumen', label: 'Dokumen' },
  { key: 'penyusutan', label: 'Penyusutan' },
  { key: 'maintenance', label: 'Maintenance' },
];

export function AssetDetailClient() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const id = searchParams.get('id') ?? '';

  const [asset, setAsset]       = useState<Asset | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [docs, setDocs]         = useState<AssetDocument[]>([]);
  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [depr, setDepr]         = useState<DepreciationEntry[]>([]);
  const [maint, setMaint]       = useState<MaintHistory[]>([]);
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);
  const [tab, setTab]           = useState('ringkasan');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    apiGet<Asset>(`/assets/${id}`).then(setAsset).catch((e: Error) => setError(e.message));
    apiGet<Category[]>('/categories').then(setCategories).catch(() => undefined);
    apiGet<AssetDocument[]>(`/assets/${id}/documents`).then(setDocs).catch(() => undefined);
    apiGet<HistoryItem[]>(`/assets/${id}/history`).then(setHistory).catch(() => undefined);
    apiGet<DepreciationEntry[]>(`/assets/${id}/depreciation`).then(setDepr).catch(() => undefined);
    apiGet<MaintHistory[]>(`/assets/${id}/maintenance-history`).then(setMaint).catch(() => undefined);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const categoryName = useMemo(
    () => categories.find((c) => c.id === asset?.categoryId)?.name ?? '—',
    [categories, asset],
  );

  async function activate() {
    setBusy(true);
    try { await apiPatch(`/assets/${id}`, { status: 'ACTIVE' }); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function regenerate() {
    setBusy(true);
    try { await apiPost(`/assets/${id}/label`, {}); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    setBusy(true);
    setConfirmDelete(false);
    try {
      await apiDelete(`/assets/${id}`);
      router.push('/assets');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!id)             return <ErrorBox message="ID aset tidak ditemukan pada URL." />;
  if (error && !asset) return <ErrorBox message={error} />;
  if (!asset)          return <Spinner />;

  return (
    <div className="space-y-5">

      {/* ── Dialog konfirmasi hapus ──────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">Hapus Aset?</h3>
            <p className="mb-1 text-sm text-slate-600">
              Anda akan menghapus <strong>{asset.name}</strong> ({asset.assetCode}).
            </p>
            <p className="mb-5 text-xs text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={busy}>
                Batal
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={busy}>
                {busy ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            <Icon name="box" width={30} height={30} />
          </div>
          <div className="mr-auto">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
            <p className="font-mono text-sm text-slate-500">{asset.assetCode}</p>
            <p className="mt-0.5 text-xs text-slate-400">Diperbarui {formatDateTime(asset.updatedAt ?? asset.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip icon={<Icon name="activity" width={16} height={16} />} label="Status" value={<StatusBadge status={asset.status} />} />
            <InfoChip icon={<Icon name="tag" width={16} height={16} />} label="Kategori" value={categoryName} />
            <InfoChip icon={<Icon name="pin" width={16} height={16} />} label="Lokasi" value={asset.locationId ? asset.locationId.slice(0, 8) : '—'} />
          </div>
          <div className="flex items-center gap-2">
            {asset.status === 'DRAFT' && (
              <Button onClick={activate} disabled={busy}>Aktifkan</Button>
            )}
            {/* Tombol Hapus dengan konfirmasi */}
            <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Hapus
            </Button>
            <Link href="/assets">
              <Button variant="secondary">Kembali</Button>
            </Link>
          </div>
        </div>
        <div className="px-5">
          <Tabs items={TABS} value={tab} onChange={setTab} />
        </div>
      </Card>

      {error ? <ErrorBox message={error} /> : null}

      {/* ── RINGKASAN ───────────────────────────────────────── */}
      {tab === 'ringkasan' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ConditionCard title={asset.status} subtitle="Status aset"
              tone={asset.status === 'ACTIVE' ? 'green' : asset.status === 'DISPOSED' ? 'red' : 'amber'}
              icon={<Icon name="check" />} />
            <ConditionCard title={formatCurrency(asset.bookValue, asset.currency)} subtitle="Nilai buku" tone="blue" icon={<Icon name="money" />} />
            <ConditionCard title={asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '—'} subtitle="Masa garansi"
              tone={asset.warrantyExpiry ? 'green' : 'slate'} icon={<Icon name="shield" />} />
            <ConditionCard title={`${docs.length} Dokumen`} subtitle="Terlampir"
              tone={docs.length > 0 ? 'blue' : 'slate'} icon={<Icon name="doc" />} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card>
                <CardHeader title="Informasi Aset" />
                <CardBody>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <KeyValue label="Brand"         value={asset.brand ?? '—'} />
                    <KeyValue label="Model"         value={asset.model ?? '—'} />
                    <KeyValue label="Serial Number" value={asset.serialNumber ?? '—'} />
                    <KeyValue label="Tipe"          value={asset.assetType ?? '—'} />
                    <KeyValue label="Kategori"      value={categoryName} />
                    <KeyValue label="Custodian"     value={asset.custodianUserId ? asset.custodianUserId.slice(0, 8) : '—'} />
                  </dl>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Finansial" />
                <CardBody>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <KeyValue label="Tanggal Beli"        value={formatDate(asset.purchaseDate)} />
                    <KeyValue label="Harga Perolehan"     value={formatCurrency(asset.purchasePrice, asset.currency)} />
                    <KeyValue label="Nilai Buku"          value={formatCurrency(asset.bookValue, asset.currency)} />
                    <KeyValue label="Umur Ekonomis"       value={asset.usefulLifeYears ? `${asset.usefulLifeYears} tahun` : '—'} />
                    <KeyValue label="Metode Penyusutan"   value={asset.depreciationMethod ?? '—'} />
                    <KeyValue label="Mata Uang"           value={asset.currency} />
                  </dl>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader
                  title="Label QR"
                  action={<Button size="sm" variant="secondary" onClick={regenerate} disabled={busy}>Generate ulang</Button>}
                />
                <CardBody className="flex flex-col items-center">
                  {asset.qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.qrUrl} alt="QR" className="h-44 w-44 rounded-lg border border-slate-200 p-2" />
                  ) : (
                    <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
                      <Icon name="qr" width={48} height={48} />
                    </div>
                  )}
                  <p className="mt-3 font-mono text-sm font-semibold text-slate-700">{asset.assetCode}</p>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Tags" />
                <CardBody className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{categoryName}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{asset.currency}</span>
                  {asset.assetType && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{asset.assetType}</span>}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ── RIWAYAT ─────────────────────────────────────────── */}
      {tab === 'riwayat' && (
        <Card>
          <CardHeader title="Riwayat Aset" />
          <CardBody>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada riwayat.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {history.map((h) => (
                  <li key={h.id}>
                    <span className="absolute -left-[6px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
                    <p className="text-sm font-medium text-slate-800">{h.eventType}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(h.occurredAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── DOKUMEN ─────────────────────────────────────────── */}
      {tab === 'dokumen' && (
        <Card>
          <CardHeader title={`Dokumen (${docs.length})`} />
          <CardBody>
            {docs.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada dokumen.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Icon name="doc" width={16} height={16} /> {d.fileName ?? d.docType}
                    </span>
                    <span className="text-xs text-slate-400">{d.docType} · {formatDate(d.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── PENYUSUTAN ──────────────────────────────────────── */}
      {tab === 'penyusutan' && (
        <Card>
          <CardHeader title="Entri Penyusutan" />
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
                      <td className="py-2">{String(d.periodMonth).padStart(2, '0')}/{d.periodYear}</td>
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
      )}

      {/* ── MAINTENANCE ─────────────────────────────────────── */}
      {tab === 'maintenance' && (
        <Card>
          <CardHeader title="Riwayat Maintenance" />
          <CardBody>
            {maint.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada riwayat maintenance.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-400">
                    <th className="pb-2">Tanggal</th>
                    <th className="pb-2">Tipe</th>
                    <th className="pb-2 text-right">Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {maint.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="py-2">{formatDate(m.performedAt)}</td>
                      <td className="py-2">{m.type}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(m.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
