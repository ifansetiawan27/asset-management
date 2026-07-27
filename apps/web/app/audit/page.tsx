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
  Spinner,
  StatusBadge,
} from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { AuditSession } from '@/lib/types';

export default function AuditPage() {
  const [sessions, setSessions] = useState<AuditSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => apiGet<AuditSession[]>('/audit/sessions').then(setSessions).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost('/audit/sessions', { name });
      setName('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, action: 'start' | 'close') {
    try {
      await apiPost(`/audit/sessions/${id}/${action}`, {});
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Audit Fisik Aset" subtitle="Sesi audit & rekonsiliasi (scan QR via mobile)" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!sessions ? (
            <Spinner />
          ) : sessions.length === 0 ? (
            <EmptyState title="Belum ada sesi audit" hint="Buat sesi audit di panel kanan." />
          ) : (
            <Card>
              <CardHeader title={`Sesi Audit (${sessions.length})`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Dibuat</th>
                      <th className="px-4 py-3 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {s.status === 'PLANNED' ? (
                            <Button size="sm" variant="secondary" onClick={() => act(s.id, 'start')}>Mulai</Button>
                          ) : s.status === 'IN_PROGRESS' ? (
                            <Button size="sm" variant="secondary" onClick={() => act(s.id, 'close')}>Tutup</Button>
                          ) : (
                            <span className="text-xs text-slate-400">selesai</span>
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
          <CardHeader title="Buat Sesi Audit" />
          <form onSubmit={createSession}>
            <CardBody className="space-y-4">
              <Field label="Nama Sesi *">
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Audit Q3 - Gedung A" />
              </Field>
              <Button type="submit" className="w-full" disabled={saving || !name}>
                {saving ? 'Menyimpan...' : 'Buat Sesi'}
              </Button>
              <p className="text-xs text-slate-400">Item audit (scan QR) di-submit dari aplikasi mobile / API.</p>
            </CardBody>
          </form>
        </Card>
      </div>
    </>
  );
}
