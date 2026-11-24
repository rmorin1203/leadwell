import { BookOpenCheck, Check, ClipboardCheck, Dumbbell, NotebookPen, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { moduleSteps, stepPath, type StepId } from '../engine/course';
import { useApp } from '../state/AppContext';
import { cx } from './ui';

export const STEP_ICONS: Record<StepId, LucideIcon> = {
  lesson: BookOpenCheck,
  practice: Dumbbell,
  assessment: ClipboardCheck,
  reflection: NotebookPen,
};

/** The module's four-step outline. Every step is open; completed steps show a check and the word "Done". */
export function ModuleSteps({ moduleId, current }: { moduleId: string; current?: StepId }) {
  const { attempts, reflections, lessons } = useApp();
  const steps = moduleSteps(moduleId, { attempts, reflections, lessons });
  return (
    <nav aria-label="Module steps" className="no-print mb-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = STEP_ICONS[s.id];
          const isCurrent = s.id === current;
          return (
            <li key={s.id}>
              <Link
                to={stepPath(moduleId, s.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cx(
                  'flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2 transition',
                  isCurrent ? 'border-navy-900 bg-navy-900 text-white' : 'border-sand-200 bg-white hover:border-teal-300',
                )}
              >
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                    s.done ? 'bg-teal-600 text-white' : isCurrent ? 'bg-white/15 text-white' : 'bg-sand-100 text-navy-800',
                  )}
                  aria-hidden
                >
                  {s.done ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon size={14} aria-hidden className={isCurrent ? 'text-teal-200' : 'text-teal-700'} /> {s.label}
                  </span>
                  <span className={cx('block text-xs', isCurrent ? 'text-slate-300' : 'text-slate-500')}>{s.done ? 'Done' : 'Not started'}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
