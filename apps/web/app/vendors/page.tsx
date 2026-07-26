'use client';

import { useEffect, useState } from 'react';

import { Button, Card, CardBody, CardHeader, EmptyState, ErrorBox, Field, Input, PageHeader, Spinner } from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { Vendor } from '@/lib/types';

export default function VendorsPage() {
  const [items, setItems] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', contact: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const load = () => apiGet<Vendor[]>('/vendors').then(setItems).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { code: form.code, name: form.name };
      if (form.contact) body.contact = form.contact;
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      await apiPost('/vendors', body);
      setForm({ code: '', name: '', contact: '', email: '', phone: '' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Vendor" subtitle="Master data vendor / supplier" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!items ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState title="Belum ada vendor" hint="Tambahkan vendor di panel kanan." />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-3 font-medium">Kode</th>
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Kontak</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{v.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{v.name}</td>
                        <td className="px-4 py-3 text-slate-500">{v.contact ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{v.email ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Tambah Vendor" />
          <form onSubmit={submit}>
            <CardBody className="space-y-4">
              <Field label="Kode *">
                <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VDR-001" />
              </Field>
              <Field label="Nama *">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PT Sumber Jaya" />
              </Field>
              <Field label="Kontak (PIC)">
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Telepon">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Button type="submit" className="w-full" disabled={saving || !form.code || !form.name}>
                {saving ? 'Menyimpan...' : 'Tambah'}
              </Button>
            </CardBody>
          </form>
        </Card>
      </div>
    </>
  );
}
