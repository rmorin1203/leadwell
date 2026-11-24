import { ArrowRight, Award, CheckCircle2, Circle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompetencyRadar } from '../components/CompetencyChart';
import { Card, LinkButton, PageHeader, ScoreBar, formatDate } from '../components/ui';
import { moduleNumber } from '../data';
import { COMPETENCIES, COMPETENCY_ORDER } from '../data/competencies';
import { courseProgress, stepPath } from '../engine/course';
import { competencyProfile } from '../engine/scoring';
import { useApp } from '../state/AppContext';

export default function CourseSummary() {
  const { attempts, reflections, lessons, profile } = useApp();
  const course = courseProgress({ attempts, reflections, lessons });
  const completed = attempts.filter((a) => a.completedAt);
  const prof = competencyProfile(completed);
  const commitments = reflections.filter((r) => r.commitment).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  if (!course.complete) {
    return (
      <div>
        <PageHeader eyebrow="Course summary" title="Your course summary isn't ready yet" description={`The summary unlocks when all ${course.modules.length} modules are complete. You've finished ${course.stepsDone} of ${course.stepsTotal} steps so far.`} />
        <ul className="grid gap-4 md:grid-cols-3">
          {course.modules.map((m) => (
            <Card as="li" key={m.scenario.id} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module {moduleNumber(m.scenario.id)}</p>
              <p className="font-semibold">{m.scenario.title}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {m.steps.map((s) => (
                  <li key={s.id}>
                    <Link to={stepPath(m.scenario.id, s.id)} className="flex items-center gap-2 hover:underline">
                      {s.done ? <CheckCircle2 size={15} className="text-teal-700" aria-hidden /> : <Circle size={15} className="text-slate-400" aria-hidden />}
                      {s.label} <span className="text-xs text-slate-500">{s.done ? '(done)' : '(to do)'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="hero-gradient rounded-3xl p-6 text-white shadow-lift sm:p-10" aria-labelledby="done-title">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-200"><Award size={16} aria-hidden /> Course complete</p>
        <h1 id="done-title" className="text-3xl font-extrabold sm:text-4xl">Well done, {profile.name.split(' ')[0]}.</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-200">
          You've completed all {course.modules.length} modules of LeadWell: The Difficult Conversations Lab, including {lessons.length} lessons, {completed.filter((a) => a.mode === 'practice').length} practice conversations, {completed.filter((a) => a.mode === 'assessment').length} assessed conversations, and {reflections.length} reflections.
        </p>
        {prof.overall !== null && <p className="mt-4 text-sm text-slate-300">Overall assessed performance: <strong className="text-white">{prof.overall}/100</strong></p>}
      </section>

      <Card as="section" className="p-6" aria-labelledby="modules">
        <h2 id="modules" className="mb-4 text-lg font-bold">Module results</h2>
        <ul className="divide-y divide-sand-100">
          {course.modules.map((m) => {
            const assessed = completed.filter((a) => a.scenarioId === m.scenario.id && a.mode === 'assessment').sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))[0];
            const lesson = lessons.find((l) => l.moduleId === m.scenario.id);
            return (
              <li key={m.scenario.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module {moduleNumber(m.scenario.id)}</p>
                  <p className="font-semibold">{m.scenario.title}</p>
                  {assessed?.outcomeId && <p className="text-sm text-slate-600">Best assessed outcome: {m.scenario.outcomes[assessed.outcomeId]?.title}</p>}
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {lesson && <span>Lesson: <strong>{lesson.correct}/{lesson.total}</strong></span>}
                  {assessed && <Link to={`/results/${assessed.id}`} className="font-semibold text-teal-700 hover:underline">Best assessment: {assessed.overallScore}/100</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section" className="p-6" aria-labelledby="comp">
          <h2 id="comp" className="text-lg font-bold">Competency overview</h2>
          <p className="mb-2 text-sm text-slate-600">From your latest assessment in each module.</p>
          <CompetencyRadar primary={prof.scores} height={260} />
          <div className="mt-4 space-y-3">
            {COMPETENCY_ORDER.map((c) => <ScoreBar key={c} label={COMPETENCIES[c].label} value={prof.scores[c]} compact />)}
          </div>
        </Card>
        <Card as="section" className="p-6" aria-labelledby="commit">
          <h2 id="commit" className="mb-1 text-lg font-bold">Your workplace commitments</h2>
          <p className="mb-4 text-sm text-slate-600">The behaviors you committed to across the course.</p>
          {commitments.length ? (
            <ul className="space-y-3">
              {commitments.map((r) => (
                <li key={r.id} className="flex gap-3 rounded-xl bg-teal-50 p-3 text-sm">
                  <Target size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden />
                  <span>{r.commitment}<span className="mt-1 block text-xs text-slate-500">{formatDate(r.createdAt)}</span></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No commitments recorded yet.</p>
          )}
          <LinkButton to="/journal" variant="secondary" className="mt-5">Open your journal <ArrowRight size={16} aria-hidden /></LinkButton>
        </Card>
      </div>
    </div>
  );
}
