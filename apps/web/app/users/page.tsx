'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorBox,
  Field,
  Input,
  PageHeader,
  Spinner,
} from '@/components/ui';
import { apiDelete, apiPatch, apiPost, apiGet } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { AppUser } from '@/lib/types';

/* ── Daftar peran beserta label ─────────────────────────── */
const ROLES = [
  { code: 'SUPER_ADMIN',         label: 'Super Admin',         desc: 'Akses penuh ke seluruh sistem' },
  { code: 'ASSET_ADMINISTRATOR', label: 'Asset Administrator', desc: 'Kelola data aset & penugasan' },
  { code: 'PROCUREMENT',         label: 'Procurement',         desc: 'Pengadaan & input aset baru' },
  { code: 'TECHNICIAN',          label: 'Teknisi',             desc: 'Kerjakan work order & maintenance' },
  { code: 'AUDITOR',             label: 'Auditor',             desc: 'Audit fisik & rekonsiliasi' },
  { code: 'DEPARTMENT_MANAGER',  label: 'Department Manager',  desc: 'Approval transfer & peminjaman' },
  { code: 'EMPLOYEE',            label: 'Employee',            desc: 'Lihat aset & buat tiket' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Tipe modal yang aktif ──────────────────────────────── */
type Modal = null | 'invite' | 'role' | 'delete';

export default function UsersPage() {
  const [users,   setUsers]   = useState<AppUser[] | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState<Modal>(null);
  const [target,  setTarget]  = useState<AppUser | null>(null); // user yg di-act
  const [busy,    setBusy]    = useState(false);
  const [flash,   setFlash]   = useState<string | null>(null);  // pesan sukses
  const [formErr, setFormErr] = useState<string | null>(null);

  /* invite form */
  const [invEmail,    setInvEmail]    = useState('');
  const [invName,     setInvName]     = useState('');
  const [invRole,     setInvRole]     = useState('EMPLOYEE');
  const [invPass,     setInvPass]     = useState('');
  const [showPass,    setShowPass]    = useState(false);

  /* role modal */
  const [selRole,     setSelRole]     = useState('EMPLOYEE');

  const me = getUser();
  const isSuperAdmin = me?.roles?.includes('SUPER_ADMIN') ?? false;

  /* ── Muat daftar user ────────────────────────────────── */
  function load() {
    setError(null);
    setUsers(null);
    apiGet<AppUser[]>('/users').then(setUsers).catch((e: Error) => setError(e.message));
  }
  useEffect(load, []);

  /* ── Buka/tutup modal ────────────────────────────────── */
  function openInvite() {
    setInvEmail(''); setInvName(''); setInvRole('EMPLOYEE');
    setInvPass(''); setShowPass(false); setFormErr(null);
    setModal('invite');
  }
  function openRole(u: AppUser) {
    setTarget(u);
    setSelRole(u.roles?.[0]?.code ?? 'EMPLOYEE');
    setFormErr(null);
    setModal('role');
  }
  function openDelete(u: AppUser) {
    setTarget(u);
    setModal('delete');
  }
  function close() { setModal(null); setTarget(null); setFormErr(null); }

  function showFlash(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  }

  /* ── Aksi: Undang ────────────────────────────────────── */
  async function handleInvite() {
    if (invName.trim().length < 2) return setFormErr('Nama lengkap minimal 2 karakter.');
    if (!EMAIL_RE.test(invEmail.trim())) return setFormErr('Format email tidak valid.');
    if (!invRole) return setFormErr('Pilih peran terlebih dahulu.');
    if (invPass.length < 8) return setFormErr('Password minimal 8 karakter.');

    setBusy(true); setFormErr(null);
    try {
      await apiPost('/users/invite', {
        fullName: invName.trim(),
        email:    invEmail.trim(),
        roleCode: invRole,
        password: invPass,
      });
      close(); load();
      showFlash(`✅ Pengguna ${invEmail.trim()} berhasil diundang sebagai ${ROLES.find(r=>r.code===invRole)?.label}.`);
    } catch (e) {
      setFormErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /* ── Aksi: Ubah Peran ────────────────────────────────── */
  async function handleUpdateRole() {
    if (!target) return;
    setBusy(true); setFormErr(null);
    try {
      await apiPatch(`/users/${target.id}/role`, { roleCode: selRole });
      close(); load();
      showFlash(`✅ Peran ${target.fullName || target.email} diubah ke ${ROLES.find(r=>r.code===selRole)?.label}.`);
    } catch (e) {
      setFormErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /* ── Aksi: Hapus ─────────────────────────────────────── */
  async function handleDelete() {
    if (!target) return;
    if (target.id === me?.sub) return setFormErr('Tidak dapat menghapus akun sendiri.');
    setBusy(true); setFormErr(null);
    try {
      await apiDelete(`/users/${target.id}`);
      close(); load();
      showFlash(`✅ Pengguna ${target.email} berhasil dihapus.`);
    } catch (e) {
      setFormErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <>
      <PageHeader
        title="Pengguna"
        subtitle="Daftar pengguna & peran (RBAC) pada tenant"
        action={
          isSuperAdmin ? (
            <Button onClick={openInvite} size="sm">
              + Undang Pengguna
            </Button>
          ) : undefined
        }
      />

      {/* Flash sukses */}
      {flash && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flash}
        </div>
      )}

      {error ? (
        <div className="mb-4"><ErrorBox message={error} /></div>
      ) : !users ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState title="Belum ada pengguna" />
      ) : (
        <Card>
          <CardHeader
            title={`Pengguna (${users.length})`}
            action={
              isSuperAdmin ? (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                  Mode Admin
                </span>
              ) : undefined
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Peran</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === me?.sub;
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${isSelf ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName || u.email} className="h-9 w-9 text-xs" />
                          <div>
                            <span className="font-medium text-slate-800">{u.fullName}</span>
                            {isSelf && (
                              <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                                Anda
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.length
                            ? u.roles.map((r) => (
                                <Badge key={r.code} color="violet">
                                  {ROLES.find(x => x.code === r.code)?.label ?? r.code}
                                </Badge>
                              ))
                            : <span className="text-slate-400">—</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={u.status === 'active' ? 'green' : 'slate'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openRole(u)}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              Ubah Peran
                            </button>
                            <button
                              onClick={() => openDelete(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════
          MODAL: Undang Pengguna
      ══════════════════════════════════════ */}
      {modal === 'invite' && (
        <ModalOverlay onClose={close} title="Undang Pengguna Baru">
          {formErr && <div className="mb-4"><ErrorBox message={formErr} /></div>}

          <Field label="Nama Lengkap">
            <Input
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder="mis. Budi Santoso"
              autoFocus
            />
          </Field>
          <div className="mt-3">
          <Field label="Email">
            <Input
              type="email"
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
            />
          </Field>
          </div>
          <div className="mt-3">
          <Field label="Peran">
            <select
              value={invRole}
              onChange={(e) => setInvRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>
          </Field>
          </div>
          <div className="mt-3">
          <Field label="Password Awal" hint="Admin berbagi password ini ke pengguna yang diundang">
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={invPass}
                onChange={(e) => setInvPass(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                {showPass ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </Field>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button size="sm" onClick={handleInvite} disabled={busy}>
              {busy ? 'Mengundang...' : 'Undang & Simpan'}
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════
          MODAL: Ubah Peran
      ══════════════════════════════════════ */}
      {modal === 'role' && target && (
        <ModalOverlay onClose={close} title="Ubah Peran Pengguna">
          <p className="mb-4 text-sm text-slate-600">
            Pengguna:{' '}
            <span className="font-semibold text-slate-800">
              {target.fullName || target.email}
            </span>
            <br />
            <span className="text-xs text-slate-400">{target.email}</span>
          </p>

          {formErr && <div className="mb-4"><ErrorBox message={formErr} /></div>}

          <Field label="Peran Baru">
            <select
              value={selRole}
              onChange={(e) => setSelRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button size="sm" onClick={handleUpdateRole} disabled={busy}>
              {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════
          MODAL: Konfirmasi Hapus
      ══════════════════════════════════════ */}
      {modal === 'delete' && target && (
        <ModalOverlay onClose={close} title="Hapus Pengguna">
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">
              Tindakan ini tidak dapat dibatalkan!
            </p>
            <p className="mt-1 text-sm text-red-600">
              Pengguna{' '}
              <span className="font-bold">{target.fullName || target.email}</span>{' '}
              ({target.email}) beserta seluruh data terkait akan dihapus permanen.
            </p>
          </div>

          {formErr && <div className="mb-4"><ErrorBox message={formErr} /></div>}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
              {busy ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
            </Button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}

/* ── Komponen modal overlay yang dapat dipakai ulang ─────── */
function ModalOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
