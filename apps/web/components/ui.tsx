'use client';

import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/* ---------------- Button ---------------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};
export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm' };
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} {...props} />;
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700',
        className,
      )}
      {...props}
    />
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}
export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {action}
    </div>
  );
}

/* ---------------- Badge / Chip ---------------- */
const BADGE_COLORS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  violet: 'bg-violet-100 text-violet-700',
};
export type BadgeColor = keyof typeof BADGE_COLORS;

export function Badge({ color = 'slate', children }: { color?: BadgeColor; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE_COLORS[color])}>
      {children}
    </span>
  );
}

export const STATUS_COLOR: Record<string, BadgeColor> = {
  ACTIVE: 'green',
  DRAFT: 'slate',
  IN_MAINTENANCE: 'amber',
  BORROWED: 'blue',
  UNDER_REVIEW: 'violet',
  RETIRED: 'slate',
  DISPOSED: 'red',
  // ticket / wo / approval / audit
  OPEN: 'red',
  ASSIGNED: 'amber',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CLOSED: 'slate',
  REQUESTED: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CONFIRMED: 'green',
  RETURNED: 'green',
  PENDING: 'amber',
  PLANNED: 'slate',
  FOUND: 'green',
  MISSING: 'red',
  DAMAGED: 'amber',
  RELOCATED: 'blue',
  ARCHIVED: 'slate',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge color={STATUS_COLOR[status] ?? 'slate'}>{status}</Badge>;
}

/* ---------------- Avatar ---------------- */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-slate-800 font-semibold text-white', className)}>
      {initials || '?'}
    </div>
  );
}

/* ---------------- Stat & Condition cards ---------------- */
const ACCENT: Record<string, { bar: string; icon: string }> = {
  green: { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
  red: { bar: 'bg-red-500', icon: 'bg-red-50 text-red-600' },
  amber: { bar: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600' },
  blue: { bar: 'bg-blue-500', icon: 'bg-blue-50 text-blue-600' },
  violet: { bar: 'bg-violet-500', icon: 'bg-violet-50 text-violet-600' },
  slate: { bar: 'bg-slate-400', icon: 'bg-slate-100 text-slate-500' },
};

export function StatCard({
  label,
  value,
  caption,
  tone = 'blue',
  icon,
}: {
  label: string;
  value: string | number;
  caption?: string;
  tone?: keyof typeof ACCENT;
  icon?: ReactNode;
}) {
  const a = ACCENT[tone];
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={cn('absolute inset-y-0 left-0 w-1', a.bar)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {caption ? <p className="mt-1 text-xs text-slate-400">{caption}</p> : null}
        </div>
        {icon ? <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', a.icon)}>{icon}</div> : null}
      </div>
    </div>
  );
}

export function ConditionCard({
  title,
  subtitle,
  tone = 'slate',
  icon,
}: {
  title: string;
  subtitle: string;
  tone?: keyof typeof ACCENT;
  icon?: ReactNode;
}) {
  const a = ACCENT[tone];
  const titleColor =
    tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-800';
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={cn('absolute inset-y-0 left-0 w-1.5', a.bar)} />
      <div className="pl-2">
        <p className={cn('text-sm font-semibold', titleColor)}>{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
      {icon ? <div className={cn('flex h-11 w-11 items-center justify-center rounded-full', a.icon)}>{icon}</div> : null}
    </div>
  );
}

/* ---------------- Header info chip ---------------- */
export function InfoChip({
  icon,
  label,
  value,
  onEdit,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      {icon ? <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</div> : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      {onEdit ? (
        <button onClick={onEdit} className="ml-1 text-slate-300 hover:text-slate-500">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
        </button>
      ) : null}
    </div>
  );
}

/* ---------------- Tabs (controlled) ---------------- */
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ key: string; label: string; icon?: ReactNode }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition',
            value === it.key
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800',
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Key/Value ---------------- */
export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

/* ---------------- Form ---------------- */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, props.className)} />;
}

/* ---------------- Misc ---------------- */
export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      Memuat...
    </div>
  );
}
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint ? <p className="mt-1 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}
