'use client';

import { useEffect, useState } from 'react';

import { Icon } from '@/components/icons';
import { Badge, Card, CardBody, CardHeader, ErrorBox, PageHeader, Spinner, StatCard } from '@/components/ui';
import { apiGet } from '@/lib/api';
import { Subscription, UsageSummary } from '@/lib/types';

function Bar({ used, max }: { used: number; max: number | null }) {
  const pct = max && max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const tone = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="mt-2">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400">{used}{max ? ` / ${max}` : ''} ({pct}%)</p>
    </div>
  );
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Subscription>('/billing/subscription').then(setSub).catch((e: Error) => setError(e.message));
    apiGet<UsageSummary>('/billing/usage').then(setUsage).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader title="Billing & Subscription" subtitle="Langganan SaaS & penggunaan kuota tenant" />
      {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}
      {!sub && !error ? <Spinner /> : null}

      {sub ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Plan" value={sub.planCode} tone="violet" icon={<Icon name="card" />} />
            <StatCard label="Status" value={sub.status} tone={sub.status === 'ACTIVE' ? 'green' : 'amber'} icon={<Icon name="check" />} />
            <StatCard label="Kuota Aset" value={sub.assetQuota} tone="blue" icon={<Icon name="box" />} />
            <StatCard label="Seats (User)" value={sub.seats} tone="slate" icon={<Icon name="users" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Penggunaan Aset" />
              <CardBody>
                <p className="text-sm text-slate-600">Aset digunakan dari kuota</p>
                <Bar used={usage?.assets.used ?? 0} max={usage?.assets.quota ?? sub.assetQuota} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Penggunaan Seats" />
              <CardBody>
                <p className="text-sm text-slate-600">User aktif dari seats</p>
                <Bar used={usage?.users.used ?? 0} max={usage?.users.seats ?? sub.seats} />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Detail Langganan" />
            <CardBody className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <Badge color="violet">{sub.planCode}</Badge>
              <Badge color={sub.status === 'ACTIVE' ? 'green' : 'amber'}>{sub.status}</Badge>
              <span className="text-slate-400">Kuota aset {sub.assetQuota} · {sub.seats} seats</span>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </>
  );
}
