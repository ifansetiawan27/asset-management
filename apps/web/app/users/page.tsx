'use client';

import { useEffect, useState } from 'react';

import { Avatar, Badge, Card, CardHeader, EmptyState, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { AppUser } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<AppUser[]>('/users').then(setUsers).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Pengguna" subtitle="Daftar pengguna & peran (RBAC) pada tenant" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}
      {!users ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState title="Belum ada pengguna" />
      ) : (
        <Card>
          <CardHeader title={`Pengguna (${users.length})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Peran</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName || u.email} className="h-9 w-9 text-xs" />
                        <span className="font-medium text-slate-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.length ? u.roles.map((r) => <Badge key={r.code} color="violet">{r.code}</Badge>) : <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.status === 'active' ? 'green' : 'slate'}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
