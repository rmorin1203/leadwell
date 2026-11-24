import { ArrowRight, Award, BookOpen, CheckCircle2, ClipboardCheck, Clock, Database, Hourglass, Lightbulb, PlayCircle, RotateCcw, Target, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompetencyRadar } from '../components/CompetencyChart';
import { STEP_ICONS } from '../components/ModuleSteps';
import { Button, Card, DifficultyBadge, LinkButton, ProgressRing, ScoreBar, Tag, cx, relativeDays } from '../components/ui';
import { UPCOMING, moduleNumber } from '../data';
import { COMPETENCIES, COMPETENCY_ORDER } from '../data/competencies';
import { STEP_LABELS, courseProgress, nextStep, stepPath } from '../engine/course';
import { focusCompetency, inProgressSessions } from '../engine/recommend';
import { competencyProfile } from '../engine/scoring';
import { useApp } from '../state/AppContext';

const COURSE_OUTCOMES = [
  'Open difficult conversations with observation and curiosity instead of judgment.',
  'Deliver specific, behavior-based feedback using the Situation–Behavior–Impact model.',
  'Balance empathy with clear expectations and accountability.',
  'Facilitate conflict impartially, moving people from positions to shared interests.',
  'Translate practice into one concrete behavior change at work.',
];

export default function Dashboard() {
  const { profile, attempts, reflections, lessons, loadSampleHistory, resetDemo } = useApp();
  const records = { attempts, reflections, lessons };
  const course = courseProgress(records);
  const completed = attempts.filter((a) => a.completedAt);
  const prof = competencyProfile(completed);
  const resumable = useMemo(() => inProgressSessions(), []);
  const next = nextStep(records);
  const focusDef = COMPETENCIES[focusCompetency(completed)];
  const started = course.stepsDone > 0;
  const [confirmReset, setConfirmReset] = useState(false);

  const continueTarget = resumable[0]
    ? { to: `/simulate/${resumable[0].scenarioId}?mode=${resumable[0].mode}`, label: `Resume Module ${moduleNumber(resumable[0].scenarioId)} ${resumable[0].mode}` }
    : course.complete
      ? { to: '/course-summary', label: 'View your course summary' }
      : next
        ? { to: stepPath(next.scenario.id, next.step), label: started ? `Continue: Module ${moduleNumber(next.scenario.id)} ${STEP_LABELS[next.step].toLowerCase()}` : 'Start Module 1' }
        : { to: '/library', label: 'Browse modules' };

  const activity = [
    ...completed.map((a) => ({
      at: a.completedAt!,
      icon: a.mode === 'assessment' ? ClipboardCheck : PlayCircle,
      text: `Module ${moduleNumber(a.scenarioId)} ${a.mode === 'assessment' ? 'assessment' : 'practice'} completed`,
      meta: `Score ${a.overallScore}/100`,
      to: `/results/${a.id}`,
    })),
    ...lessons.map((l) => ({ at: l.completedAt, icon: Lightbulb, text: `Module ${moduleNumber(l.moduleId)} lesson completed`, meta: `${l.correct} of ${l.total} correct`, to: stepPath(l.moduleId, 'lesson') })),
    ...reflections.map((r) => ({
      at: r.createdAt,
      icon: BookOpen,
      text: r.scenarioId ? `Module ${moduleNumber(r.scenarioId)} reflection written` : 'Journal entry written',
      meta: r.commitment ? 'Commitment recorded' : 'Reflection',
      to: '/journal',
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Course hero */}
      <section className="hero-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lift sm:p-10" aria-labelledby="course-title">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium text-teal-200">Welcome{started ? ' back' : ''}, {profile.name.split(' ')[0]}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-300">Interactive course</p>
            <h1 id="course-title" className="mt-1 text-3xl font-extrabold sm:text-4xl">LeadWell: The Difficult Conversations Lab</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
              Practice the conversations most leaders avoid. In each module, you'll learn a key model, try it in an interactive activity, practice with a realistic employee, demonstrate your judgment in an assessment, and reflect on how you'll use it at work.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton to={continueTarget.to} className="bg-teal-400 text-navy-950 hover:bg-teal-300">
                {continueTarget.label} <ArrowRight size={16} aria-hidden />
              </LinkButton>
              <LinkButton to="/library" variant="ghost" className="text-white hover:bg-white/10">
                View all modules
              </LinkButton>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-5 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <ProgressRing value={course.percent} label="Course progress" />
            <div>
              <p className="text-sm font-semibold">Course progress</p>
              <p className="mt-1 text-sm text-slate-300">{course.stepsDone} of {course.stepsTotal} steps done</p>
              <p className="mt-1 text-sm text-slate-300">{course.modulesComplete} of {course.modules.length} modules complete</p>
            </div>
          </div>
        </div>
      </section>

      {course.complete && (
        <Card className="flex flex-col gap-4 border-teal-200 bg-teal-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 font-semibold"><Award className="text-teal-700" aria-hidden /> You've completed the course. Your summary is ready.</p>
          <LinkButton to="/course-summary">View course summary <ArrowRight size={16} aria-hidden /></LinkButton>
        </Card>
      )}

      {/* Overview + how it works */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card as="section" className="p-6 lg:col-span-3" aria-labelledby="about-heading">
          <p className="eyebrow mb-2">About this course</p>
          <h2 id="about-heading" className="text-xl font-bold">Learning outcomes</h2>
          <p className="mt-1 text-sm text-slate-600">By the end of the course, you will be able to:</p>
          <ul className="mt-4 space-y-2.5">
            {COURSE_OUTCOMES.map((o) => (
              <li key={o} className="flex gap-2.5 text-sm"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-teal-600" aria-hidden />{o}</li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-4 border-t border-sand-100 pt-5 text-sm sm:grid-cols-3">
            <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><Users size={13} aria-hidden /> Audience</dt><dd className="mt-1">New, emerging, and experienced managers</dd></div>
            <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><Clock size={13} aria-hidden /> Time</dt><dd className="mt-1">About 30–40 minutes per module</dd></div>
            <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><Target size={13} aria-hidden /> Format</dt><dd className="mt-1">Self-paced; take modules in any order</dd></div>
          </dl>
        </Card>

        <Card as="section" className="p-6 lg:col-span-2" aria-labelledby="how-heading">
          <p className="eyebrow mb-2">How each module works</p>
          <h2 id="how-heading" className="text-xl font-bold">Four steps per module</h2>
          <ol className="mt-4 space-y-4">
            {([
              ['lesson', 'Learn a key model and try it in a short interactive activity.'],
              ['practice', 'Talk with a fictional employee and get coaching after every decision.'],
              ['assessment', 'Run the conversation again without hints. Your choices are scored.'],
              ['reflection', 'Commit to one behavior to use in your next real conversation.'],
            ] as const).map(([id, text], i) => {
              const Icon = STEP_ICONS[id];
              return (
                <li key={id} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700"><Icon size={16} aria-hidden /></span>
                  <span className="text-sm"><span className="font-semibold">Step {i + 1}: {STEP_LABELS[id]}.</span> <span className="text-slate-600">{text}</span></span>
                </li>
              );
            })}
          </ol>
          {!started && (
            <div className="mt-6 rounded-xl border border-sand-200 bg-sand-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><Database size={15} aria-hidden /> Exploring the demo?</p>
              <p className="mt-1 text-xs text-slate-600">Load fictional progress to see the course partly completed.</p>
              <Button variant="secondary" className="mt-3 w-full" onClick={loadSampleHistory}>Load sample progress</Button>
            </div>
          )}
        </Card>
      </div>

      {/* Syllabus */}
      <section aria-labelledby="syllabus-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow mb-1">Syllabus</p>
            <h2 id="syllabus-heading" className="text-xl font-bold">Course modules</h2>
          </div>
          <Link to="/library" className="text-sm font-semibold text-teal-700 hover:underline">Open the scenario library</Link>
        </div>
        <ol className="space-y-3">
          {course.modules.map((m) => {
            const done = m.steps.filter((s) => s.done).length;
            return (
              <Card as="li" key={m.scenario.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white', done === 4 ? 'bg-teal-600' : 'bg-navy-900')} aria-hidden>
                    {done === 4 ? <CheckCircle2 size={22} /> : moduleNumber(m.scenario.id)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module {moduleNumber(m.scenario.id)}{done === 4 ? ', complete' : ''}</p>
                    <h3 className="text-base font-bold">{m.scenario.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <DifficultyBadge level={m.scenario.difficulty} />
                      {m.steps.map((s) => {
                        const Icon = STEP_ICONS[s.id];
                        return (
                          <Link key={s.id} to={stepPath(m.scenario.id, s.id)} className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', s.done ? 'bg-teal-50 text-teal-800' : 'bg-sand-100 text-slate-600 hover:bg-sand-200')}>
                            {s.done ? <CheckCircle2 size={12} aria-hidden /> : <Icon size={12} aria-hidden />} {s.label}
                            <span className="sr-only">{s.done ? ' (done)' : ' (not started)'}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-slate-600">{done} of 4 steps</span>
                    <LinkButton to={`/modules/${m.scenario.id}`} variant={done > 0 && done < 4 ? 'primary' : 'secondary'}>
                      {done === 0 ? 'Start' : done === 4 ? 'Review' : 'Continue'}<span className="sr-only"> Module {moduleNumber(m.scenario.id)}</span>
                    </LinkButton>
                  </div>
                </div>
              </Card>
            );
          })}
          {UPCOMING.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 rounded-2xl border border-dashed border-sand-300 bg-white/50 p-5 md:flex-row md:items-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sand-100 text-lg font-extrabold text-slate-500" aria-hidden>{moduleNumber(s.id)}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module {moduleNumber(s.id)}</p>
                <h3 className="text-base font-bold text-slate-600">{s.title}</h3>
              </div>
              <Tag className="w-fit"><Hourglass size={11} className="mr-1" aria-hidden /> Coming soon</Tag>
            </li>
          ))}
        </ol>
      </section>

      {/* Competency overview */}
      <Card as="section" className="p-6" aria-labelledby="comp-heading">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 id="comp-heading" className="text-lg font-bold">Leadership competency overview</h2>
            <p className="text-sm text-slate-600">
              {prof.source === 'assessment' && `From your latest assessment in ${prof.attemptsCounted} module(s).`}
              {prof.source === 'practice' && 'Practice estimate. Complete an assessment step to record a verified score.'}
              {prof.source === 'none' && 'Your scores appear after your first practice or assessment conversation.'}
            </p>
          </div>
          {prof.source !== 'none' && <Tag className={prof.source === 'assessment' ? 'bg-teal-50 text-teal-800' : ''}>{prof.source === 'assessment' ? 'Assessed' : 'Practice estimate'}</Tag>}
        </div>
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          {Object.keys(prof.scores).length >= 3 ? (
            <CompetencyRadar primary={prof.scores} height={260} />
          ) : (
            <div className="grid h-[200px] place-items-center rounded-xl bg-sand-50 text-center text-sm text-slate-500">
              <span><Target className="mx-auto mb-2" aria-hidden />The chart appears after your first conversation</span>
            </div>
          )}
          <div className="space-y-3">
            {COMPETENCY_ORDER.map((c) => <ScoreBar key={c} label={COMPETENCIES[c].label} value={prof.scores[c]} compact />)}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section" className="border-teal-200 bg-gradient-to-br from-white to-teal-50 p-6" aria-labelledby="refresh-heading">
          <p className="eyebrow mb-1 flex items-center gap-1.5"><Lightbulb size={14} aria-hidden /> This week's practice tip</p>
          <h2 id="refresh-heading" className="text-base font-bold">{focusDef.label}</h2>
          <p className="mt-2 text-sm font-medium text-navy-900">"{focusDef.refresher.principle}"</p>
          <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Try this week:</span> {focusDef.refresher.tryThis}</p>
        </Card>

        <Card as="section" className="p-6" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="mb-3 text-lg font-bold">Recent activity</h2>
          {activity.length ? (
            <ul className="divide-y divide-sand-100">
              {activity.map((a, i) => (
                <li key={i}>
                  <Link to={a.to} className="flex items-start gap-3 rounded-lg py-3 hover:bg-sand-50">
                    <a.icon size={18} className="mt-0.5 shrink-0 text-teal-700" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-navy-900">{a.text}</span>
                      <span className="block text-xs text-slate-600">{a.meta}, {relativeDays(a.at).toLowerCase()}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No activity yet. Your lessons, conversations, and reflections will appear here.</p>
          )}
        </Card>
      </div>

      {started && (
        <div className="flex flex-col items-start gap-3 border-t border-sand-200 pt-6 text-sm">
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-slate-600 hover:text-rose-700">
              <RotateCcw size={14} aria-hidden /> Reset course progress
            </button>
          ) : (
            <div role="alertdialog" aria-labelledby="reset-q" className="w-full max-w-lg rounded-xl border border-rose-100 bg-rose-50 p-4">
              <p id="reset-q" className="font-semibold text-rose-700">Delete all lessons, conversations, scores, and journal entries in this browser? This cannot be undone.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>Yes, reset everything</Button>
                <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
