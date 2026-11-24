import { Award, BookOpen, Check, LayoutDashboard, Library, Menu, UserRound, X } from 'lucide-react';
import { moduleNumber } from '../data';
import { courseProgress } from '../engine/course';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { Toasts, cx } from './ui';

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Scenario Library', icon: Library },
  { to: '/journal', label: 'Reflection Journal', icon: BookOpen },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-sm">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 5v14h10" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-extrabold tracking-tight text-white">LeadWell</span>
        <span className="block text-[11px] font-medium text-teal-200/90">The Difficult Conversations Lab</span>
      </span>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { attempts, reflections, lessons } = useApp();
  const course = courseProgress({ attempts, reflections, lessons });
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
      isActive ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#7DBEB8]' : 'text-slate-300 hover:bg-white/5 hover:text-white',
    );
  return (
    <nav aria-label="Primary">
      <ul className="space-y-1">
        {mainNav.map((n) => (
          <li key={n.to}>
            <NavLink to={n.to} end={n.end} onClick={onNavigate} className={linkClass}>
              <n.icon size={18} aria-hidden />
              {n.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <p className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Course outline</p>
      <ul className="space-y-1">
        {course.modules.map((m) => {
          const done = m.steps.filter((s) => s.done).length;
          return (
            <li key={m.scenario.id}>
              <NavLink to={`/modules/${m.scenario.id}`} onClick={onNavigate} className={linkClass}>
                <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', done === 4 ? 'bg-teal-500 text-navy-950' : 'bg-white/10 text-white')} aria-hidden>
                  {done === 4 ? <Check size={13} strokeWidth={3} /> : moduleNumber(m.scenario.id)}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate">{m.scenario.shortTitle}</span>
                  <span className="block text-[11px] text-slate-400">{done} of 4 steps{done === 4 ? ', complete' : ''}</span>
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      {course.complete && (
        <ul className="mt-1">
          <li>
            <NavLink to="/course-summary" onClick={onNavigate} className={linkClass}>
              <Award size={18} aria-hidden /> Course summary
            </NavLink>
          </li>
        </ul>
      )}
    </nav>
  );
}

function UserChip() {
  const { profile } = useApp();
  return (
    <div className="flex items-center gap-3 px-1">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-sand-200 text-sm font-semibold text-navy-900">
        <UserRound size={18} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
        <p className="truncate text-xs text-slate-400">{profile.role}</p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Brand />
      <div className="flex-1 overflow-y-auto">
        <NavItems onNavigate={() => setOpen(false)} />
      </div>
      <UserChip />
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lift">
        Skip to main content
      </a>
      <aside className="no-print fixed inset-y-0 left-0 hidden w-72 bg-navy-900 lg:block">{sidebar}</aside>

      {/* Mobile header */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between bg-navy-900 px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} aria-controls="mobile-nav" className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10">
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation" id="mobile-nav">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-navy-900 shadow-lift animate-rise">
            <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="absolute right-3 top-4 grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10">
              <X size={20} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="no-print border-b border-amber-100 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700 sm:px-8">
        <strong className="font-semibold">Demonstration mode.</strong> All employees, scenarios, and results are fictional. Progress is saved in this browser only.
      </div>

      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8 outline-none sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
      <Toasts />
    </div>
  );
}
