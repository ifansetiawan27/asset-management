'use client';

import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/* ── Utility ─────────────────────────────────────────────── */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/* ══════════════════════════════════════════════════════════
   BUTTON
══════════════════════════════════════════════════════════ */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:pointer-events-none active:scale-[.98]';

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
  };

  const variants = {
    primary:
      'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
    secondary:
      'bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    danger:
      'bg-red-600 text-white shadow-sm hover:bg-red-700',
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white ' +
        'text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700',
        className,
      )}
      {...props}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   CARD
══════════════════════════════════════════════════════════ */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {action}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BADGE / STATUS
   Spec: 🟢 green=Active  🟡 amber=Maintenance/Warn
         🔴 red=Damaged   🔵 blue=Storage/Transit
══════════════════════════════════════════════════════════ */
type BadgeVariant = {
  bg: string;
  text: string;
  dot: string;
  ring: string;
};

const BADGE_VARIANTS: Record<string, BadgeVariant> = {
  green:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  amber:  { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-500/20' },
  red:    { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     ring: 'ring-red-500/20' },
  blue:   { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-500/20' },
  violet: { bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500',  ring: 'ring-violet-500/20' },
  slate:  { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   ring: 'ring-slate-400/20' },
};

export type BadgeColor = keyof typeof BADGE_VARIANTS;

export function Badge({
  color = 'slate',
  dot = false,
  children,
}: {
  color?: BadgeColor;
  dot?: boolean;
  children: ReactNode;
}) {
  const v = BADGE_VARIANTS[color] ?? BADGE_VARIANTS.slate;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1',
        v.bg, v.text, v.ring,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />}
      {children}
    </span>
  );
}

/* Status → colour mapping per spec */
export const STATUS_COLOR: Record<string, BadgeColor> = {
  // Asset status
  ACTIVE:         'green',
  DRAFT:          'slate',
  IN_MAINTENANCE: 'amber',
  BORROWED:       'blue',
  UNDER_REVIEW:   'violet',
  RETIRED:        'slate',
  DISPOSED:       'red',
  // Maintenance
  OPEN:           'red',
  ASSIGNED:       'amber',
  IN_PROGRESS:    'blue',
  COMPLETED:      'green',
  CLOSED:         'slate',
  // Approvals
  REQUESTED:      'amber',
  APPROVED:       'green',
  REJECTED:       'red',
  CONFIRMED:      'green',
  RETURNED:       'green',
  PENDING:        'amber',
  PLANNED:        'slate',
  // Audit
  FOUND:          'green',
  MISSING:        'red',
  DAMAGED:        'amber',
  RELOCATED:      'blue',
  ARCHIVED:       'slate',
};

/* Status label: UNDER_REVIEW → "Under Review" */
function humanize(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge color={STATUS_COLOR[status] ?? 'slate'} dot>
      {humanize(status)}
    </Badge>
  );
}

/* ══════════════════════════════════════════════════════════
   AVATAR
══════════════════════════════════════════════════════════ */
export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white',
        className,
      )}
    >
      {initials || '?'}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARD  — top-coloured-border style
══════════════════════════════════════════════════════════ */
const ACCENT_MAP: Record<
  string,
  { top: string; icon: string; iconText: string }
> = {
  green:  { top: 'border-t-emerald-500', icon: 'bg-emerald-50',  iconText: 'text-emerald-600' },
  red:    { top: 'border-t-red-500',     icon: 'bg-red-50',      iconText: 'text-red-600' },
  amber:  { top: 'border-t-amber-500',   icon: 'bg-amber-50',    iconText: 'text-amber-600' },
  blue:   { top: 'border-t-blue-500',    icon: 'bg-blue-50',     iconText: 'text-blue-600' },
  violet: { top: 'border-t-violet-500',  icon: 'bg-violet-50',   iconText: 'text-violet-600' },
  slate:  { top: 'border-t-slate-400',   icon: 'bg-slate-100',   iconText: 'text-slate-500' },
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
  tone?: keyof typeof ACCENT_MAP;
  icon?: ReactNode;
}) {
  const a = ACCENT_MAP[tone] ?? ACCENT_MAP.blue;
  return (
    <div
      className={cn(
        'rounded-xl border-t-4 border border-slate-200 bg-white px-5 py-4 shadow-card transition hover:shadow-card-hover',
        a.top,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {value}
          </p>
          {caption ? (
            <p className="mt-1 text-xs text-slate-400">{caption}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              a.icon, a.iconText,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Condition card (mini metric) ─────────────────────────── */
export function ConditionCard({
  title,
  subtitle,
  tone = 'slate',
  icon,
}: {
  title: string;
  subtitle: string;
  tone?: keyof typeof ACCENT_MAP;
  icon?: ReactNode;
}) {
  const a = ACCENT_MAP[tone] ?? ACCENT_MAP.slate;
  const titleColors: Record<string, string> = {
    green: 'text-emerald-700',
    red: 'text-red-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    violet: 'text-violet-700',
    slate: 'text-slate-800',
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-card transition hover:shadow-card-hover">
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-semibold', titleColors[tone] ?? titleColors.slate)}>
          {title}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
      {icon ? (
        <div
          className={cn(
            'ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            a.icon, a.iconText,
          )}
        >
          {icon}
        </div>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INFO CHIP
══════════════════════════════════════════════════════════ */
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
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      {icon ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      {onEdit ? (
        <button
          onClick={onEdit}
          className="shrink-0 text-slate-300 transition hover:text-brand-600"
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════ */
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
    <div className="flex gap-0.5 overflow-x-auto border-b border-slate-200">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-100',
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

/* ══════════════════════════════════════════════════════════
   KEY / VALUE
══════════════════════════════════════════════════════════ */
export function KeyValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value ?? '—'}</dd>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORM ELEMENTS
══════════════════════════════════════════════════════════ */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm ' +
  'placeholder:text-slate-400 transition ' +
  'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

/**
 * CurrencyInput — input angka Rupiah dengan pemisah titik otomatis.
 *
 * - value   : string angka mentah tanpa titik, mis. "70000002"
 * - onChange : dipanggil dengan string angka mentah, mis. "70000002"
 * - Tampilan : "70.000.002" (format ID)
 * - inputMode="numeric" agar keyboard angka muncul di HP
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & {
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
}) {
  /** Tambahkan titik sebagai pemisah ribuan: "70000002" → "70.000.002" */
  function toDisplay(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('id-ID');
  }

  /** Format placeholder juga jika berupa angka */
  function fmtPlaceholder(p?: string): string | undefined {
    if (!p) return p;
    const num = parseInt(p.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? p : num.toLocaleString('id-ID');
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw);
  }

  return (
    <div className={cn('relative', className)}>
      {/* Prefiks "Rp" */}
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-slate-400">
        Rp
      </span>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        value={toDisplay(value)}
        onChange={handleChange}
        placeholder={fmtPlaceholder(placeholder)}
        className={cn(inputBase, 'pl-9 tabular-nums')}
      />
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputBase, 'resize-none leading-relaxed', props.className)}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   MISC
══════════════════════════════════════════════════════════ */
export function Spinner({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-6 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      {label}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293L8.293 13.29A1 1 0 0 0 7.586 13H4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint ? (
        <p className="mt-1 max-w-xs text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="mt-0.5 shrink-0 text-red-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}
