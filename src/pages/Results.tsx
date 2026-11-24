import { ArrowRight, Award, BookMarked, CheckCircle2, ChevronDown, ClipboardCheck, Compass, Dumbbell, Printer, Quote, RotateCcw, Sprout, TrendingUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CompetencyRadar } from '../components/CompetencyChart';
import { Button, Card, DifficultyBadge, LinkButton, QualityBadge, ScoreBar, Tag, cx, formatDate } from '../components/ui';
import { getScenario } from '../data';
import { COMPETENCIES, proficiency } from '../data/competencies';
import { clearSession } from '../engine/recommend';
import { STEP_LABELS, courseProgress, moduleSteps, stepPath } from '../engine/course';
import { ModuleSteps } from '../components/ModuleSteps';
import { moduleNumber } from '../data';
import { getOption } from '../engine/simulation';
import { scorePath } from '../engine/scoring';
import { useApp } from '../state/AppContext';
import type { ScenarioOutcome } from '../types';
import NotFound from './NotFound';
import { IS_SANDBOXED } from '../env';

const tierMeta: Record<ScenarioOutcome['tier'], { label: string; icon: typeof Award; cls: string }> = {
  breakthrough: { label: 'Breakthrough outcome', icon: Award, cls: 'bg-teal-600 text-white' },
  productive: { label: 'Productive outcome', icon: TrendingUp, cls: 'bg-teal-100 text-teal-800' },
  partial: { label: 'Partial outcome', icon: Compass, cls: 'bg-amber-100 text-amber-700' },
  strained: { label: 'Strained outcome', icon: Sprout, cls: 'bg-rose-100 text-rose-700' },
};

export default function Results() {
  const { attemptId } = useParams();
  const { attempts, reflections, lessons } = useApp();
  const navigate = useNavigate();
  const attempt = attempts.find((a) => a.id === attemptId);
  const scenario = getScenario(attempt?.scenarioId);
  if (!attempt || !scenario || !attempt.completedAt) return <NotFound message="We couldn't find that result. It may have been cleared when demo data was reset." />;

  const outcome = attempt.outcomeId ? scenario.outcomes[attempt.outcomeId] : undefined;
  const score = scorePath(scenario, attempt.decisions);
  const prev = attempts
    .filter((a) => a.scenarioId === scenario.id && a.completedAt && a.id !== attempt.id && a.completedAt < attempt.completedAt!)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1))[0];
  const p = proficiency(attempt.overallScore ?? 0);
  const tier = outcome ? tierMeta[outcome.tier] : null;
  const records = { attempts, reflections, lessons };
  const nextInModule = moduleSteps(scenario.id, records).find((s) => !s.done);
  const course = courseProgress(records);
  const nextModule = course.modules.find((m) => m.scenario.id !== scenario.id && m.steps.some((s) => !s.done));
  const resources = (score.growthAreas.length ? score.growthAreas : scenario.competencies.slice(0, 2)).flatMap((c) => COMPETENCIES[c].resources.slice(0, 1).map((r) => ({ ...r, competency: c })));
  const existingReflection = reflections.find((r) => r.attemptId === attempt.id);
  const totalRetries = attempt.decisions.reduce((a, d) => a + d.retries, 0);

  const replay = (mode: 'practice' | 'assessment') => {
    clearSession(scenario.id);
    navigate(`/simulate/${scenario.id}?mode=${mode}`);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to={`/modules/${scenario.id}`} className="text-sm font-semibold text-teal-700 hover:underline">← Module {moduleNumber(scenario.id)}: {scenario.title}</Link>
        {!IS_SANDBOXED && <Button variant="ghost" onClick={() => window.print()}><Printer size={16} aria-hidden /> Print or save as PDF</Button>}
      </div>

      <ModuleSteps moduleId={scenario.id} current={attempt.mode} />

      {/* Outcome */}
      <section className="hero-gradient overflow-hidden rounded-3xl p-6 text-white shadow-lift sm:p-10" aria-labelledby="outcome-title">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {tier && (
                <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', tier.cls)}>
                  <tier.icon size={14} aria-hidden /> {tier.label}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {attempt.mode === 'assessment' ? <ClipboardCheck size={14} aria-hidden /> : <Dumbbell size={14} aria-hidden />}
                {attempt.mode === 'assessment' ? 'Final assessment (recorded)' : 'Practice (formative)'}
              </span>
            </div>
            <p className="text-sm text-teal-200">{scenario.title}, {formatDate(attempt.completedAt, true)}</p>
            <h1 id="outcome-title" className="mt-1 text-3xl font-extrabold">{outcome?.title}</h1>
            <p className="mt-3 leading-relaxed text-slate-200">{outcome?.narrative}</p>
            <blockquote className="mt-5 flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <Quote size={18} className="shrink-0 text-teal-300" aria-hidden />
              <p className="text-sm italic text-slate-100">{outcome?.employeePerspective}</p>
            </blockquote>
          </div>
          <div className="rounded-2xl bg-white/5 p-6 text-center ring-1 ring-white/10 lg:min-w-[220px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Overall performance</p>
            <p className="mt-2 text-5xl font-extrabold tabular-nums">{attempt.overallScore}<span className="text-xl text-slate-400">/100</span></p>
            <p className="mt-1 text-sm font-semibold text-teal-200">{p.label}</p>
            {prev && (
              <p className="mt-3 text-xs text-slate-300">
                {(attempt.overallScore ?? 0) - (prev.overallScore ?? 0) >= 0 ? '▲' : '▼'} {Math.abs((attempt.overallScore ?? 0) - (prev.overallScore ?? 0))} vs. previous attempt
              </p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              {score.qualityCounts.effective} effective, {score.qualityCounts.partial} partial, {score.qualityCounts.limited} missed
            </p>
          </div>
        </div>
      </section>

      <Card className="p-6" as="section" aria-labelledby="ahead">
        <h2 id="ahead" className="mb-1 text-base font-bold">Looking ahead</h2>
        <p className="text-sm leading-relaxed text-slate-700">{outcome?.lookingAhead}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section" className="p-6" aria-labelledby="comp-results">
          <h2 id="comp-results" className="text-lg font-bold">Competency scores</h2>
          <p className="mb-2 text-sm text-slate-600">{prev ? 'Dashed outline shows your previous attempt.' : 'Scores reflect the competencies assessed in this scenario.'}</p>
          <CompetencyRadar primary={score.competencies} comparison={prev?.competencyScores} primaryLabel="This attempt" comparisonLabel="Previous attempt" competencies={Object.keys(score.competencies) as never} />
          <div className="mt-4 space-y-3">
            {(Object.entries(score.competencies) as [keyof typeof COMPETENCIES, number][]).map(([c, v]) => (
              <ScoreBar key={c} label={COMPETENCIES[c].label} value={v} />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card as="section" className="p-6" aria-labelledby="strengths">
            <h2 id="strengths" className="mb-3 flex items-center gap-2 text-lg font-bold"><CheckCircle2 size={18} className="text-teal-700" aria-hidden /> Strengths demonstrated</h2>
            {score.strengths.length ? (
              <ul className="space-y-3">
                {score.strengths.map((c) => (
                  <li key={c} className="text-sm">
                    <span className="font-semibold">{COMPETENCIES[c].label}</span> — {score.competencies[c]}/100
                    <span className="block text-slate-600">{COMPETENCIES[c].description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No competency reached the proficient level (70+) this time. Review the decision feedback below — every attempt builds the pattern.</p>
            )}
          </Card>
          <Card as="section" className="p-6" aria-labelledby="growth">
            <h2 id="growth" className="mb-3 flex items-center gap-2 text-lg font-bold"><Sprout size={18} className="text-amber-700" aria-hidden /> Areas for development</h2>
            {score.growthAreas.length ? (
              <ul className="space-y-3">
                {score.growthAreas.map((c) => (
                  <li key={c} className="text-sm">
                    <span className="font-semibold">{COMPETENCIES[c].label}</span> — {score.competencies[c]}/100
                    <span className="block text-slate-600">Look for: {COMPETENCIES[c].indicators.slice(0, 3).join('; ').toLowerCase()}.</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">All assessed competencies were at proficient or above. Try the assessment mode or a harder scenario to stretch further.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Decision review */}
      <Card as="section" className="p-6" aria-labelledby="review">
        <h2 id="review" className="text-lg font-bold">Decision-by-decision review</h2>
        <p className="mb-4 text-sm text-slate-600">
          {attempt.mode === 'assessment' ? 'Feedback was held back during the assessment. Here is the coaching for each of your decisions.' : `Coaching for the choices you kept.${totalRetries ? ` You rewound ${totalRetries} time${totalRetries > 1 ? 's' : ''} to explore alternatives.` : ''}`}
        </p>
        <ol className="space-y-3">
          {attempt.decisions.map((d, i) => {
            const node = scenario.nodes[d.nodeId];
            const o = getOption(scenario, d.nodeId, d.optionId);
            if (!node || !o) return null;
            return (
              <li key={i}>
                <details className="group rounded-xl border border-sand-200" open={i === 0}>
                  <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Decision {i + 1}: {node.label}</span>
                      <span className="mt-1 block text-sm font-medium text-navy-900">{o.text}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <QualityBadge quality={o.quality} />
                      {d.retries > 0 && <Tag>{d.retries} retr{d.retries > 1 ? 'ies' : 'y'}</Tag>}
                      <ChevronDown size={16} className="transition group-open:rotate-180" aria-hidden />
                    </span>
                  </summary>
                  <div className="grid gap-3 border-t border-sand-100 p-4 text-sm sm:grid-cols-2">
                    <p><span className="font-semibold text-teal-800">Did well: </span>{o.feedback.didWell}</p>
                    <p><span className="font-semibold text-teal-800">To improve: </span>{o.feedback.improve}</p>
                    <p><span className="font-semibold text-teal-800">Why it matters: </span>{o.feedback.why}</p>
                    <p><span className="font-semibold text-teal-800">How it landed: </span>{o.feedback.perception}</p>
                    <p className="rounded-lg bg-teal-50 p-3 sm:col-span-2"><span className="font-semibold text-teal-800">Alternative: </span>{o.feedback.alternative}</p>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card as="section" className="p-6" aria-labelledby="principles">
          <h2 id="principles" className="mb-3 text-base font-bold">Key principles from this scenario</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {scenario.keyPrinciples.map((k) => (
              <li key={k} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal-600" aria-hidden />{k}</li>
            ))}
          </ul>
        </Card>
        <Card as="section" className="p-6" aria-labelledby="resources">
          <h2 id="resources" className="mb-3 flex items-center gap-2 text-base font-bold"><BookMarked size={17} aria-hidden /> Recommended resources</h2>
          <ul className="space-y-3 text-sm">
            {resources.map((r) => (
              <li key={r.title}>
                <span className="font-semibold">{r.title}</span> <span className="text-slate-500">({r.type})</span>
                <span className="block text-xs text-slate-500">{r.source}, for {COMPETENCIES[r.competency].label}</span>
                <span className="block text-slate-700">{r.why}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card as="section" className="p-6" aria-labelledby="next">
          <h2 id="next" className="mb-3 text-base font-bold">What's next</h2>
          {nextInModule ? (
            <>
              <p className="text-sm text-slate-600">Next step in this module:</p>
              <p className="mt-1 font-semibold">Step {['lesson', 'practice', 'assessment', 'reflection'].indexOf(nextInModule.id) + 1}: {STEP_LABELS[nextInModule.id]}</p>
              <LinkButton to={stepPath(scenario.id, nextInModule.id)} className="no-print mt-4 w-full">Go to {STEP_LABELS[nextInModule.id].toLowerCase()} <ArrowRight size={16} aria-hidden /></LinkButton>
            </>
          ) : course.complete ? (
            <>
              <p className="text-sm text-slate-600">You've completed every module in the course.</p>
              <LinkButton to="/course-summary" className="no-print mt-4 w-full">View course summary <ArrowRight size={16} aria-hidden /></LinkButton>
            </>
          ) : nextModule ? (
            <>
              <p className="text-sm text-slate-600">This module is complete. Continue with:</p>
              <p className="mt-1 font-semibold">Module {moduleNumber(nextModule.scenario.id)}: {nextModule.scenario.title}</p>
              <div className="my-2"><DifficultyBadge level={nextModule.scenario.difficulty} /></div>
              <LinkButton to={`/modules/${nextModule.scenario.id}`} variant="secondary" className="no-print mt-2 w-full">Open module <ArrowRight size={16} aria-hidden /></LinkButton>
            </>
          ) : null}
          <div className="no-print mt-4 space-y-2 border-t border-sand-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Replay this scenario</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => replay('practice')}><RotateCcw size={15} aria-hidden /> Practice</Button>
              <Button variant="secondary" onClick={() => replay('assessment')}><ClipboardCheck size={15} aria-hidden /> Assess</Button>
            </div>
          </div>
        </Card>
      </div>

      <ReflectionForm attemptId={attempt.id} scenarioId={scenario.id} existing={existingReflection} />
    </div>
  );
}

export function ReflectionForm({ attemptId, scenarioId, existing, heading = 'Turn this practice into action', eyebrow = 'Reflection activity: transfer to the workplace' }: { attemptId?: string; scenarioId: string; existing?: { id: string; text: string; commitment?: string }; heading?: string; eyebrow?: string }) {
  const { saveReflection, notify } = useApp();
  const [text, setText] = useState(existing?.text ?? '');
  const [commitment, setCommitment] = useState(existing?.commitment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!existing);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (commitment.trim().length < 10) {
      setError('Please describe your commitment in at least a few words (10+ characters).');
      document.getElementById('commitment')?.focus();
      return;
    }
    setError(null);
    saveReflection({
      id: existing?.id,
      attemptId,
      scenarioId,
      prompt: 'What is one behavior you will apply in your next workplace conversation?',
      text: text.trim(),
      commitment: commitment.trim(),
    });
    setSaved(true);
    notify('Reflection saved to your journal. The reflection step is checked off.');
  };

  return (
    <Card as="section" className="no-print border-teal-200 p-6 sm:p-8" aria-labelledby="reflect">
      <p className="eyebrow mb-1">{eyebrow}</p>
      <h2 id="reflect" className="text-xl font-bold">{heading}</h2>
      <p className="mt-1 text-sm text-slate-600">Your reflections are private and saved to your journal. This completes the module's reflection step.</p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div>
          <label htmlFor="reflection" className="label">What did you notice about your own approach? <span className="font-normal text-slate-500">(optional)</span></label>
          <textarea id="reflection" rows={3} className="input" value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} placeholder="e.g., I moved to solutions before I understood the problem." />
        </div>
        <div>
          <label htmlFor="commitment" className="label">What is one behavior you will apply in your next workplace conversation? <span className="text-rose-700">*</span></label>
          <textarea
            id="commitment"
            rows={2}
            className={cx('input', error && 'border-rose-600')}
            value={commitment}
            onChange={(e) => { setCommitment(e.target.value); setSaved(false); }}
            aria-invalid={!!error}
            aria-describedby={error ? 'commitment-error' : 'commitment-hint'}
            required
            placeholder="e.g., Ask one open question and wait five seconds before speaking again."
          />
          {error ? (
            <p id="commitment-error" className="mt-1.5 text-sm text-rose-700" role="alert">{error}</p>
          ) : (
            <p id="commitment-hint" className="mt-1.5 text-xs text-slate-500">Make it specific and observable — something a colleague could see you do.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">{existing ? 'Update reflection' : 'Save to journal'}</Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-teal-700" role="status">
              <CheckCircle2 size={16} aria-hidden /> Saved. <Link to="/journal" className="font-semibold underline">Open journal</Link>
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
