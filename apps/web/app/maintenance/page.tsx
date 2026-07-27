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
  Input,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
} from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Asset, Paginated, Ticket } from '@/lib/types';

const SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ assetId: '', problem: '', severity: 'MEDIUM' });
  const [saving, setSaving] = useState(false);

  const load = () => apiGet<Ticket[]>('/maintenance/tickets').then(setTickets).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
    apiGet<Paginated<Asset>>('/assets?limit=100').then((r) => setAssets(r.data)).catch(() => undefined);
  }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost('/maintenance/tickets', { assetId: form.assetId, problem: form.problem, severity: form.severity });
      setForm({ assetId: '', problem: '', severity: 'MEDIUM' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function runDue() {
    setMsg(null);
    try {
      const r = await apiPost<{ processed: number }>('/maintenance/schedules/run-due', {});
      setMsg(`Jadwal preventive diproses: ${r.processed} work order dibuat.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Maintenance & Inspection"
        subtitle="Tiket kerusakan, work order, dan jadwal preventive"
        action={<Button variant="secondary" onClick={runDue}>Jalankan jadwal jatuh tempo</Button>}
      />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}
      {msg ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!tickets ? (
            <Spinner />
          ) : tickets.length === 0 ? (
            <EmptyState title="Belum ada tiket" hint="Buat tiket kerusakan di panel kanan." />
          ) : (
            <Card>
              <CardHeader title={`Tiket (${tickets.length})`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-3 font-medium">Masalah</th>
                      <th className="px-4 py-3 font-medium">Severity</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Dibuat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{t.problem}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.severity} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Lapor Kerusakan" />
          <form onSubmit={createTicket}>
            <CardBody className="space-y-4">
              <Field label="Aset *">
                <Select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
                  <option value="">Pilih aset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.assetCode} — {a.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Masalah *">
                <Input required value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Layar tidak menyala" />
              </Field>
              <Field label="Tingkat Keparahan">
                <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Button type="submit" className="w-full" disabled={saving || !form.assetId || !form.problem}>
                {saving ? 'Menyimpan...' : 'Buat Tiket'}
              </Button>
            </CardBody>
          </form>
        </Card>
      </div>
    </>
  );
}
