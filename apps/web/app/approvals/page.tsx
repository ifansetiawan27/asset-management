'use client';

import { useEffect, useState } from 'react';

import { Button, Card, CardHeader, EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { ApprovalReq } from '@/lib/types';

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalReq[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => apiGet<ApprovalReq[]>('/approvals/inbox').then(setItems).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusy(id + action);
    setError(null);
    try {
      await apiPost(`/approvals/${id}/${action}`, { note: action === 'approve' ? 'Disetujui' : 'Ditolak' });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Approval Inbox" subtitle="Persetujuan transfer, peminjaman & disposal (Department Manager)" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}

      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="Tidak ada approval menunggu" hint="Semua permintaan sudah diproses." />
      ) : (
        <Card>
          <CardHeader title={`Menunggu Persetujuan (${items.filter(i => ['PENDING','REQUESTED'].includes(i.status)).length})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Approver Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const isPending = ['PENDING', 'REQUESTED'].includes(a.status);
                  return (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{a.entityType}</td>
                      <td className="px-4 py-3 text-slate-500">{a.approverRole}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(a.createdAt)}</td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => decide(a.id, 'approve')} disabled={busy !== null}>Setujui</Button>
                            <Button size="sm" variant="danger" onClick={() => decide(a.id, 'reject')} disabled={busy !== null}>Tolak</Button>
                          </div>
                        ) : (
                          <span className="flex justify-end text-xs text-slate-400">Sudah diproses</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
