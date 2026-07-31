'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button, Card, CardBody, CardHeader, CurrencyInput, ErrorBox, Field, Input, PageHeader, Select } from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { Asset, Category, Vendor } from '@/lib/types';

export default function NewAssetPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    brand: '',
    model: '',
    serialNumber: '',
    assetType: '',
    purchaseDate: '',
    purchasePrice: '',
    usefulLifeYears: '',
    currency: 'IDR',
    vendorId: '',
  });

  useEffect(() => {
    apiGet<Category[]>('/categories').then((c) => {
      setCategories(c);
      if (c.length > 0) setForm((f) => ({ ...f, categoryId: c[0].id }));
    });
    apiGet<Vendor[]>('/vendors').then(setVendors).catch(() => undefined);
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        categoryId: form.categoryId,
        currency: form.currency || 'IDR',
      };
      if (form.brand) body.brand = form.brand;
      if (form.model) body.model = form.model;
      if (form.serialNumber) body.serialNumber = form.serialNumber;
      if (form.assetType) body.assetType = form.assetType;
      if (form.purchaseDate) body.purchaseDate = form.purchaseDate;
      if (form.purchasePrice) body.purchasePrice = Number(form.purchasePrice);
      if (form.usefulLifeYears) body.usefulLifeYears = Number(form.usefulLifeYears);
      if (form.vendorId) body.vendorId = form.vendorId;

      const created = await apiPost<Asset>('/assets', body);
      router.push(`/assets/detail?id=${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Tambah Aset"
        subtitle="Input data aset baru (Procurement & Onboarding)"
        action={
          <Link href="/assets">
            <Button variant="secondary">Kembali</Button>
          </Link>
        }
      />

      <form onSubmit={submit}>
        <Card>
          <CardHeader title="Data Aset" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Aset *">
              <Input required value={form.name} onChange={set('name')} placeholder="Laptop Dell Latitude 5440" />
            </Field>
            <Field label="Kategori *">
              <Select required value={form.categoryId} onChange={set('categoryId')}>
                {categories.length === 0 ? <option value="">(belum ada kategori)</option> : null}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Brand">
              <Input value={form.brand} onChange={set('brand')} placeholder="Dell" />
            </Field>
            <Field label="Model">
              <Input value={form.model} onChange={set('model')} placeholder="Latitude 5440" />
            </Field>
            <Field label="Serial Number">
              <Input value={form.serialNumber} onChange={set('serialNumber')} />
            </Field>
            <Field label="Tipe Aset">
              <Input value={form.assetType} onChange={set('assetType')} placeholder="IT Equipment" />
            </Field>
            <Field label="Tanggal Pembelian">
              <Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
            </Field>
            <Field label="Harga Beli (IDR)">
              <CurrencyInput
                value={form.purchasePrice}
                onChange={(raw) => setForm((f) => ({ ...f, purchasePrice: raw }))}
                placeholder="15000000"
              />
            </Field>
            <Field label="Umur Ekonomis (tahun)">
              <Input type="number" min="0" value={form.usefulLifeYears} onChange={set('usefulLifeYears')} placeholder="4" />
            </Field>
            <Field label="Vendor">
              <Select value={form.vendorId} onChange={set('vendorId')}>
                <option value="">(tanpa vendor)</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} — {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
            {error ? <span className="mr-auto text-sm text-red-600">{error}</span> : null}
            <Link href="/assets">
              <Button type="button" variant="ghost">
                Batal
              </Button>
            </Link>
            <Button type="submit" disabled={saving || !form.name || !form.categoryId}>
              {saving ? 'Menyimpan...' : 'Simpan Aset'}
            </Button>
          </div>
        </Card>
      </form>
      {error && categories.length === 0 ? <div className="mt-3"><ErrorBox message={error} /></div> : null}
    </>
  );
}
