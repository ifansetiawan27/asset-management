'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorBox,
  Field,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
} from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Asset, Disposal, Paginated } from '@/lib/types';

const REASONS = ['DAMAGED', 'SOLD', 'LOST', 'EXPIRED', 'DONATION'];

export default function DisposalPage() {
  const [items, setItems] = useState<Disposal[] | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ assetId: '', reason: 'DAMAGED' });
  const [saving, setSaving] = useState(false);

  const load = () => apiGet<Disposal[]>('/disposals').then(setItems).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
    apiGet<Paginated<Asset>>('/assets?limit=100').then((r) => setAssets(r.data)).catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost('/disposals', { assetId: form.assetId, reason: form.reason });
      setForm({ assetId: '', reason: 'DAMAGED' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, action: 'finalize' | 'archive') {
    try {
      await apiPost(`/disposals/${id}/${action}`, {});
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Disposal & Retirement" subtitle="Pengajuan penghapusan aset (approval oleh Manager)" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!items ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState title="Belum ada pengajuan disposal" hint="Ajukan disposal di panel kanan." />
          ) : (
            <Card>
              <CardHeader title={`Disposal (${items.length})`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-3 font-medium">Alasan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Nilai Jual</th>
                      <th className="px-4 py-3 font-medium">Dibuat</th>
                      <th className="px-4 py-3 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{d.reason}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(d.saleValue)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {d.status === 'UNDER_REVIEW' ? (
                            <Button size="sm" variant="secondary" onClick={() => act(d.id, 'finalize')}>Finalisasi</Button>
                          ) : d.status === 'DISPOSED' ? (
                            <Button size="sm" variant="secondary" onClick={() => act(d.id, 'archive')}>Arsip</Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Ajukan Disposal" />
          <form onSubmit={submit}>
            <CardBody className="space-y-4">
              <Field label="Aset *">
                <Select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
                  <option value="">Pilih aset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.assetCode} — {a.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Alasan">
                <Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
              <Button type="submit" className="w-full" disabled={saving || !form.assetId}>
                {saving ? 'Mengajukan...' : 'Ajukan Disposal'}
              </Button>
              <p className="text-xs text-slate-400">Setelah diajukan, Department Manager menyetujui di menu Approval, lalu Finalisasi.</p>
            </CardBody>
          </form>
        </Card>
      </div>
    </>
  );
}
