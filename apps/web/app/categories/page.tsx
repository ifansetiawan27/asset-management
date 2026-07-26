'use client';

import { useEffect, useState } from 'react';

import { Button, Card, CardBody, CardHeader, EmptyState, ErrorBox, Field, Input, PageHeader, Select, Spinner } from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { Category } from '@/lib/types';

const METHODS = ['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION'];

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', defaultUsefulLifeYears: '', defaultDepreciationMethod: 'STRAIGHT_LINE' });
  const [saving, setSaving] = useState(false);

  const load = () => apiGet<Category[]>('/categories').then(setItems).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        code: form.code,
        name: form.name,
        defaultDepreciationMethod: form.defaultDepreciationMethod,
      };
      if (form.defaultUsefulLifeYears) body.defaultUsefulLifeYears = Number(form.defaultUsefulLifeYears);
      await apiPost('/categories', body);
      setForm({ code: '', name: '', defaultUsefulLifeYears: '', defaultDepreciationMethod: 'STRAIGHT_LINE' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Kategori Aset" subtitle="Master data kategori" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!items ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState title="Belum ada kategori" hint="Tambahkan kategori di panel kanan." />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-3 font-medium">Kode</th>
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Umur</th>
                      <th className="px-4 py-3 font-medium">Metode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                        <td className="px-4 py-3">{c.defaultUsefulLifeYears ?? '-'} th</td>
                        <td className="px-4 py-3 text-slate-500">{c.defaultDepreciationMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Tambah Kategori" />
          <form onSubmit={submit}>
            <CardBody className="space-y-4">
              <Field label="Kode *">
                <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="IT" />
              </Field>
              <Field label="Nama *">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="IT Equipment" />
              </Field>
              <Field label="Umur Ekonomis (tahun)">
                <Input type="number" min="0" value={form.defaultUsefulLifeYears} onChange={(e) => setForm({ ...form, defaultUsefulLifeYears: e.target.value })} />
              </Field>
              <Field label="Metode Penyusutan">
                <Select value={form.defaultDepreciationMethod} onChange={(e) => setForm({ ...form, defaultDepreciationMethod: e.target.value })}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
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
