'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL;
import { useState } from 'react';

import { Button, ErrorBox, Field, Input } from '@/components/ui';
import { register } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();

  // Redirect ke landing page yang sudah memiliki modal register
  useEffect(() => {
    if (LANDING_URL) {
      window.location.replace(LANDING_URL + '#reg');
    }
  }, []);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (fullName.trim().length < 2) return 'Nama lengkap minimal 2 karakter.';
    if (!EMAIL_RE.test(email.trim())) return 'Format email tidak valid.';
    if (password.length < 8) return 'Password minimal 8 karakter.';
    if (password !== confirm) return 'Konfirmasi password tidak cocok.';
    return null;
  }

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await register(fullName.trim(), email.trim(), password);
      router.push('/');
    } catch (e2) {
      setErr((e2 as Error).message);
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
          <h2 className="text-3xl font-bold leading-tight">Buat akun baru<br />untuk mulai mengelola aset.</h2>
          <p className="mt-4 max-w-md text-sm text-indigo-200">
            Daftar dengan email Anda. Akun pertama pada sistem otomatis menjadi Super Admin dan dapat mengundang pengguna lain.
          </p>
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

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daftar akun</h1>
          <p className="mt-1 text-sm text-slate-500">Gunakan email pribadi/resmi Anda untuk membuat akun.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {err ? <ErrorBox message={err} /> : null}
            <Field label="Nama lengkap">
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="mis. Ifan Setiawan"
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" hint="Minimal 8 karakter">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Konfirmasi password">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
