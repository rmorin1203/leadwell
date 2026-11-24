import { AlertCircle, CheckCircle2, CircleDot, Info, X, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { proficiency } from '../data/competencies';
import type { Difficulty, Persona, ResponseQuality } from '../types';
import { useApp } from '../state/AppContext';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-700 shadow-sm',
  secondary: 'bg-white text-navy-900 border border-sand-300 hover:border-teal-400 hover:bg-teal-50',
  ghost: 'text-navy-800 hover:bg-sand-100',
  danger: 'bg-white text-rose-700 border border-rose-100 hover:bg-rose-50',
};
const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';

export function Button({ variant = 'primary', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cx(base, variants[variant], className)} {...rest} />;
}

export function LinkButton({ variant = 'primary', className, ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...rest} />;
}

export function Card({ className, children, as: As = 'div', ...rest }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' | 'li' } & Record<string, unknown>) {
  return (
    <As className={cx('card', className)} {...rest}>
      {children}
    </As>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </header>
  );
}

const diffStyle: Record<Difficulty, string> = {
  beginner: 'bg-teal-50 text-teal-800 border-teal-200',
  intermediate: 'bg-sand-100 text-navy-800 border-sand-300',
  advanced: 'bg-navy-900 text-white border-navy-900',
};
const diffBars: Record<Difficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', diffStyle[level])}>
      <span aria-hidden className="flex items-end gap-[2px]">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx('w-[3px] rounded-sm', i <= diffBars[level] ? 'bg-current' : 'bg-current opacity-25')} style={{ height: 4 + i * 2 }} />
        ))}
      </span>
      {level}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-medium text-slate-700', className)}>{children}</span>;
}

const qualityMeta: Record<ResponseQuality, { label: string; icon: LucideIcon; cls: string }> = {
  effective: { label: 'Effective approach', icon: CheckCircle2, cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  partial: { label: 'Partially effective', icon: CircleDot, cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  limited: { label: 'Missed opportunity', icon: AlertCircle, cls: 'bg-rose-50 text-rose-700 border-rose-100' },
};

export function QualityBadge({ quality }: { quality: ResponseQuality }) {
  const m = qualityMeta[quality];
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', m.cls)}>
      <m.icon size={14} aria-hidden /> {m.label}
    </span>
  );
}
export const qualityLabel = (q: ResponseQuality) => qualityMeta[q].label;

const toneBar = { strong: 'bg-teal-600', solid: 'bg-teal-400', developing: 'bg-amber-600', emerging: 'bg-rose-600' };

/** A labeled score bar — value, band name, and bar, never color alone. */
export function ScoreBar({ label, value, sublabel, compact }: { label: string; value: number | undefined; sublabel?: string; compact?: boolean }) {
  const has = typeof value === 'number';
  const p = has ? proficiency(value!) : null;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={cx('font-medium text-navy-800', compact ? 'text-xs' : 'text-sm')}>{label}</span>
        <span className="text-xs text-slate-600 tabular-nums">
          {has ? (
            <>
              <span className="font-semibold text-navy-900">{value}</span>/100, {p!.label}
            </>
          ) : (
            sublabel ?? 'Not yet assessed'
          )}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-sand-200"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={has ? value : undefined}
        aria-valuetext={has ? `${value} out of 100, ${p!.label}` : 'Not yet assessed'}
      >
        {has && <div className={cx('h-full rounded-full transition-all duration-700', toneBar[p!.tone])} style={{ width: `${value}%` }} />}
      </div>
    </div>
  );
}

export function ProgressRing({ value, size = 96, label }: { value: number; size?: number; label: string }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={8} fill="none" className="text-white/15" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={8} fill="none" strokeLinecap="round" className="text-teal-300 transition-all duration-700" strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} />
      </svg>
      <span className="absolute text-xl font-bold tabular-nums">{value}%</span>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
          <Icon size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-navy-900 tabular-nums">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs text-slate-600">{hint}</p>}
    </Card>
  );
}

const avatarTones = ['bg-teal-600', 'bg-navy-700', 'bg-[#6B5B45]', 'bg-[#3E6A8A]', 'bg-[#7A4E5C]', 'bg-[#4F6B4A]'];
export function Avatar({ persona, size = 'md' }: { persona: Pick<Persona, 'initials' | 'id' | 'name'>; size?: 'sm' | 'md' | 'lg' }) {
  const idx = [...persona.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % avatarTones.length;
  const sz = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg' }[size];
  return (
    <span aria-hidden className={cx('inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-white', avatarTones[idx], sz)}>
      {persona.initials}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action, headingLevel = 3 }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode; headingLevel?: 1 | 2 | 3 }) {
  const H = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-sand-300 bg-white/60 px-6 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-sand-100 text-slate-600">
        <Icon size={22} aria-hidden />
      </span>
      <H className="text-base font-semibold text-navy-900">{title}</H>
      {children && <div className="mt-1 max-w-md text-sm text-slate-600">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-print mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-sand-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x.id === value);
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
              onChange(n.id);
              document.getElementById(`tab-${n.id}`)?.focus();
            }
          }}
          className={cx('min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-colors', value === t.id ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {toasts.map((t) => {
        const Icon = t.tone === 'error' ? AlertCircle : t.tone === 'info' ? Info : CheckCircle2;
        return (
          <div key={t.id} className={cx('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lift animate-rise', t.tone === 'error' ? 'border-rose-100' : 'border-sand-200')}>
            <Icon size={18} aria-hidden className={t.tone === 'error' ? 'text-rose-600 mt-0.5' : 'text-teal-600 mt-0.5'} />
            <p className="flex-1 text-sm text-navy-900">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="rounded p-0.5 text-slate-500 hover:text-navy-900" aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function formatDate(iso: string, withTime = false) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) });
}

export function relativeDays(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}
