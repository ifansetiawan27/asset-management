'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Jika ada NEXT_PUBLIC_LANDING_URL, redirect ke sana.
// Halaman ini tetap tersedia sebagai fallback Demo Mode.
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL;

import { Icon } from '@/components/icons';
import { Button, ErrorBox, Field, Input } from '@/components/ui';
import { login } from '@/lib/auth';
import { isDemo } from '@/lib/demo/config';

const ACCOUNTS = [
  { email: 'superadmin@demo.local', role: 'Super Admin', desc: 'Mengelola seluruh sistem', color: 'bg-violet-100 text-violet-700' },
  { email: 'assetadmin@demo.local', role: 'Asset Administrator', desc: 'Mengelola data aset', color: 'bg-blue-100 text-blue-700' },
  { email: 'procurement@demo.local', role: 'Procurement', desc: 'Input aset baru', color: 'bg-emerald-100 text-emerald-700' },
  { email: 'teknisi@demo.local', role: 'Teknisi', desc: 'Maintenance & Repair', color: 'bg-amber-100 text-amber-700' },
  { email: 'auditor@demo.local', role: 'Auditor', desc: 'Audit fisik aset', color: 'bg-cyan-100 text-cyan-700' },
  { email: 'manager@demo.local', role: 'Department Manager', desc: 'Approval peminjaman & mutasi', color: 'bg-fuchsia-100 text-fuchsia-700' },
  { email: 'employee@demo.local', role: 'Employee', desc: 'Lihat aset & buat tiket', color: 'bg-slate-100 text-slate-700' },
];

const PASSWORD = 'Passw0rd!';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(isDemo() ? 'superadmin@demo.local' : '');
  const [password, setPassword] = useState(isDemo() ? PASSWORD : '');

  // Redirect ke landing page jika bukan demo mode
  useEffect(() => {
    if (!isDemo() && LANDING_URL) {
      window.location.replace(LANDING_URL);
    }
  }, []);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doLogin(u: string, p: string) {
    setBusy(true);
    setErr(null);
    try {
      await login(u, p);
      router.push('/');
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/20">A</div>
          <div>
            <div className="text-lg font-bold leading-tight">AMS</div>
            <div className="text-xs text-indigo-200">Asset Management System</div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Kelola siklus hidup aset<br />secara menyeluruh.</h2>
          <p className="mt-4 max-w-md text-sm text-indigo-200">
            Enterprise &amp; SaaS Multi-Tenant — pengadaan, tracking, maintenance, audit, penyusutan, hingga disposal. Dengan RBAC & isolasi data antar-tenant.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs">
            {['Multi-Tenant RLS', 'Keycloak OIDC', 'RBAC 7 Peran', 'QR & Audit'].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{t}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-indigo-300/70">© 2026 Asset Management System</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">A</div>
              <span className="text-lg font-bold">AMS</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isDemo()
              ? 'Gunakan akun demo, atau pilih peran di bawah.'
              : 'Masuk dengan email dan password akun Anda.'}
          </p>
          {isDemo() ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
              Mode Demo aktif — data contoh &amp; tidak persisten (tanpa backend).
            </div>
          ) : null}

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              doLogin(email, password);
            }}
          >
            {err ? <ErrorBox message={err} /> : null}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {isDemo() ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> Login cepat sebagai peran <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-2">
                {ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    disabled={busy}
                    onClick={() => doLogin(a.email, PASSWORD)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.color}`}>
                      <Icon name="user" width={18} height={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{a.role}</span>
                      <span className="block text-xs text-slate-400">{a.desc}</span>
                    </span>
                    <span className="hidden text-[11px] text-slate-400 sm:block">{a.email}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-400">Password semua akun demo: <code className="rounded bg-slate-100 px-1">Passw0rd!</code></p>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                Daftar di sini
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
