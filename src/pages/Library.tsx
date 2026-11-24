import { CheckCircle2, ChevronDown, Clock, Hourglass, Search, SearchX, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, Button, Card, DifficultyBadge, EmptyState, LinkButton, PageHeader, Tag, cx } from '../components/ui';
import { ALL_SCENARIOS, getPersona, moduleNumber } from '../data';
import { moduleSteps } from '../engine/course';
import { COMPETENCIES, COMPETENCY_ORDER } from '../data/competencies';
import { useApp } from '../state/AppContext';
import type { CompetencyId, Difficulty, ScenarioMeta } from '../types';

type Status = 'all' | 'available' | 'upcoming';

export default function LibraryPage() {
  const { attempts, reflections, lessons } = useApp();
  const [q, setQ] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [competency, setCompetency] = useState<CompetencyId | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ALL_SCENARIOS.filter((s) => {
      if (difficulty !== 'all' && s.difficulty !== difficulty) return false;
      if (competency !== 'all' && !s.competencies.includes(competency)) return false;
      if (status !== 'all' && s.status !== status) return false;
      if (!term) return true;
      const hay = [s.title, s.summary, ...s.tags, ...s.competencies.map((c) => COMPETENCIES[c].label), ...s.objectives.map((o) => o.text)].join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [q, difficulty, competency, status]);

  const clear = () => {
    setQ('');
    setDifficulty('all');
    setCompetency('all');
    setStatus('all');
  };
  const filtered = q || difficulty !== 'all' || competency !== 'all' || status !== 'all';

  return (
    <div>
      <PageHeader
        eyebrow="Scenario Library"
        title="Course modules"
        description="Each module pairs a short interactive lesson with a branching conversation with a fictional employee. Your choices shape how they respond, and how the conversation ends."
      />

      <Card className="mb-6 p-4 sm:p-5" as="section" aria-label="Search and filter scenarios">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label htmlFor="search" className="sr-only">Search modules</label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <input id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search modules by topic, skill, or keyword…" className="input pl-10" />
            </div>
          </div>
          <Select id="f-diff" label="Difficulty" value={difficulty} onChange={(v) => setDifficulty(v as Difficulty | 'all')} options={[['all', 'All levels'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']]} />
          <Select id="f-comp" label="Competency" value={competency} onChange={(v) => setCompetency(v as CompetencyId | 'all')} options={[['all', 'All competencies'], ...COMPETENCY_ORDER.map((c) => [c, COMPETENCIES[c].label] as [string, string])]} />
          <Select id="f-status" label="Availability" value={status} onChange={(v) => setStatus(v as Status)} options={[['all', 'All modules'], ['available', 'Available now'], ['upcoming', 'Coming soon']]} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600" aria-live="polite">
          <span>
            Showing {results.length} of {ALL_SCENARIOS.length} modules
          </span>
          {filtered && (
            <button onClick={clear} className="font-semibold text-teal-700 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {results.length ? (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((s) => (
            <ScenarioCard key={s.id} s={s} stepsDone={s.status === 'available' ? moduleSteps(s.id, { attempts, reflections, lessons }).filter((x) => x.done).length : 0} />
          ))}
        </ul>
      ) : (
        <EmptyState icon={SearchX} title="No modules match your filters" action={<Button variant="secondary" onClick={clear}>Clear filters</Button>}>
          Try a different keyword or remove a filter.
        </EmptyState>
      )}
    </div>
  );
}

function Select({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none pr-9 md:w-48" aria-label={label}>
          {options.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
      </div>
    </div>
  );
}

function ScenarioCard({ s, stepsDone }: { s: ScenarioMeta; stepsDone: number }) {
  const upcoming = s.status === 'upcoming';
  const personas = s.personaIds.map(getPersona).filter(Boolean);
  const headingId = `sc-${s.id}`;
  return (
    <Card as="li" className={cx('flex flex-col p-6 transition', upcoming ? 'bg-sand-50/70' : 'hover:shadow-lift')} aria-labelledby={headingId}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge level={s.difficulty} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Clock size={13} aria-hidden /> {s.estimatedMinutes} min</span>
        {upcoming && <Tag className="bg-navy-900/5 text-navy-800"><Hourglass size={11} className="mr-1" aria-hidden /> Coming soon</Tag>}
        {!upcoming && (stepsDone === 4 ? <Tag className="bg-teal-50 text-teal-800"><CheckCircle2 size={11} className="mr-1" aria-hidden /> Module complete</Tag> : <Tag>{stepsDone} of 4 steps done</Tag>)}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module {moduleNumber(s.id)}</p>
      <h2 id={headingId} className="text-lg font-bold leading-snug">{s.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.summary}</p>

      <div className="mt-4 flex items-center gap-2">
        <span className="flex -space-x-2">{personas.map((p) => <Avatar key={p!.id} persona={p!} size="sm" />)}</span>
        <span className="text-xs text-slate-600">
          with {personas.map((p) => `${p!.name} (${p!.archetypeLabel.toLowerCase()})`).join(' & ')}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Competencies">
        {s.competencies.map((c) => <Tag key={c}>{COMPETENCIES[c].label}</Tag>)}
      </div>

      <details className="group mt-4 rounded-xl border border-sand-200 bg-white/60">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-navy-800">
          <span className="flex items-center gap-2"><Target size={15} aria-hidden /> Learning objectives</span>
          <ChevronDown size={16} className="transition group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="list-disc space-y-1.5 px-4 pb-4 pl-8 text-sm text-slate-700">
          {s.objectives.map((o) => <li key={o.id}>{o.text}</li>)}
        </ul>
      </details>

      <div className="mt-auto pt-5">
        {upcoming ? (
          <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-slate-700">Coming soon. This module is in development.</p>
        ) : (
          <LinkButton to={`/modules/${s.id}`} className="w-full">
            {stepsDone === 0 ? 'Start module' : stepsDone === 4 ? 'Review module' : 'Continue module'}
          </LinkButton>
        )}
      </div>
    </Card>
  );
}
