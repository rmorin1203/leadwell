import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, MapPin, Target } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { STEP_ICONS } from '../components/ModuleSteps';
import { Avatar, Card, DifficultyBadge, LinkButton, Tag, cx } from '../components/ui';
import { getLesson, getPersona, getScenario, getScenarioMeta, moduleNumber } from '../data';
import { COMPETENCIES } from '../data/competencies';
import { moduleSteps, stepPath, type StepId } from '../engine/course';
import { loadSession } from '../engine/recommend';
import { useApp } from '../state/AppContext';
import NotFound from './NotFound';

export default function Module() {
  const { id } = useParams();
  const scenario = getScenario(id);
  const meta = getScenarioMeta(id);
  const { attempts, reflections, lessons } = useApp();

  if (!scenario) {
    if (!meta) return <NotFound />;
    return (
      <div className="max-w-2xl">
        <Link to="/library" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline"><ArrowLeft size={16} aria-hidden /> Back to library</Link>
        <Card className="p-8">
          <Tag>Module {moduleNumber(meta.id)}, coming soon</Tag>
          <h1 className="mt-3 text-2xl font-bold">{meta.title}</h1>
          <p className="mt-2 text-slate-600">{meta.summary}</p>
          <p className="mt-4 text-sm text-slate-600">This module is in development and will be added to the course in a future release.</p>
          <LinkButton to="/library" variant="secondary" className="mt-6">Choose an available module</LinkButton>
        </Card>
      </div>
    );
  }

  const lesson = getLesson(scenario.id);
  const steps = moduleSteps(scenario.id, { attempts, reflections, lessons });
  const doneCount = steps.filter((s) => s.done).length;
  const personas = scenario.personaIds.map(getPersona).filter((p): p is NonNullable<typeof p> => !!p);
  const saved = loadSession(scenario.id);
  const resumable = saved && saved.steps.length > 0 && saved.currentNodeId ? saved.mode : null;

  const stepCopy: Record<StepId, { title: string; text: string; minutes: number }> = {
    lesson: { title: lesson?.title ?? 'Lesson', text: 'Learn the key model, then try it in a short interactive activity.', minutes: lesson?.estimatedMinutes ?? 5 },
    practice: { title: 'Practice conversation', text: 'Talk with the employee, get coaching after every decision, and rewind to try other approaches.', minutes: scenario.estimatedMinutes },
    assessment: { title: 'Assessed conversation', text: 'Run the conversation again with no hints or rewinds. Feedback and scores appear at the end.', minutes: scenario.estimatedMinutes },
    reflection: { title: 'Reflection', text: 'Commit to one behavior you will use in your next real workplace conversation.', minutes: 3 },
  };

  return (
    <div>
      <Link to="/library" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline"><ArrowLeft size={16} aria-hidden /> Back to library</Link>

      <header className="mb-8">
        <p className="eyebrow mb-2">Module {moduleNumber(scenario.id)}</p>
        <h1 className="text-3xl font-extrabold">{scenario.title}</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-slate-600">{scenario.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DifficultyBadge level={scenario.difficulty} />
          <span className="inline-flex items-center gap-1 text-sm text-slate-600"><Clock size={14} aria-hidden /> About {(lesson?.estimatedMinutes ?? 5) + scenario.estimatedMinutes * 2 + 3} minutes in total</span>
          <Tag className={doneCount === 4 ? 'bg-teal-50 text-teal-800' : ''}>
            {doneCount === 4 ? <><CheckCircle2 size={12} className="mr-1" aria-hidden /> Module complete</> : `${doneCount} of 4 steps done`}
          </Tag>
        </div>
      </header>

      <section aria-labelledby="steps-heading" className="mb-8">
        <h2 id="steps-heading" className="mb-1 text-lg font-bold">Module steps</h2>
        <p className="mb-4 text-sm text-slate-600">Complete all four steps to finish the module. You can take them in any order.</p>
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((s, i) => {
            const Icon = STEP_ICONS[s.id];
            const c = stepCopy[s.id];
            const isResume = (s.id === 'practice' || s.id === 'assessment') && resumable === s.id;
            return (
              <Card as="li" key={s.id} className={cx('flex flex-col p-5', s.done && 'border-teal-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', s.done ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700')}>
                      <Icon size={20} aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {i + 1}: {s.label}</p>
                      <h3 className="text-base font-bold">{c.title}</h3>
                    </div>
                  </div>
                  {s.done ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800"><CheckCircle2 size={13} aria-hidden /> Done</span>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-500">{c.minutes} min</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600">{c.text}</p>
                {s.detail && <p className="mt-2 text-xs font-medium text-navy-800">{s.detail}</p>}
                <div className="mt-auto pt-4">
                  <LinkButton to={stepPath(scenario.id, s.id)} variant={s.done ? 'secondary' : 'primary'} className="w-full sm:w-auto">
                    {isResume ? 'Resume where you left off' : s.done ? (s.id === 'reflection' ? 'Add another reflection' : s.id === 'lesson' ? 'Review lesson' : 'Run it again') : 'Start'}
                    <ArrowRight size={16} aria-hidden />
                  </LinkButton>
                </div>
              </Card>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card as="section" className="p-6" aria-labelledby="situation">
            <h2 id="situation" className="mb-3 text-lg font-bold">The situation</h2>
            <p className="mb-4 flex items-start gap-2 text-sm text-slate-600"><MapPin size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden /> {scenario.context.setting}</p>
            <p className="leading-relaxed text-navy-900">{scenario.context.situation}</p>
            <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Background</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {scenario.context.background.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">What you know going in</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {scenario.context.whatYouKnow.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </Card>
          <Card as="section" className="p-6" aria-labelledby="objective">
            <h2 id="objective" className="mb-2 flex items-center gap-2 text-lg font-bold"><Flag size={18} className="text-teal-700" aria-hidden /> Your objective as the manager</h2>
            <p className="leading-relaxed">{scenario.context.managerObjective}</p>
            <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Who you'll be talking with</h3>
            <ul className="space-y-3">
              {personas.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <Avatar persona={p} />
                  <span className="text-sm"><span className="font-semibold">{p.name}</span> ({p.pronouns}), {p.role}, {p.tenure.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card as="section" className="h-fit p-6" aria-labelledby="objectives">
          <h2 id="objectives" className="mb-3 flex items-center gap-2 text-lg font-bold"><Target size={18} aria-hidden /> Learning objectives</h2>
          <p className="mb-3 text-sm text-slate-600">By the end of this module, you will be able to:</p>
          <ol className="space-y-3">
            {scenario.objectives.map((o, i) => (
              <li key={o.id} className="flex gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{i + 1}</span>
                <span>
                  {o.text}
                  <span className="mt-1 block text-xs text-slate-500">{COMPETENCIES[o.competency].label}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
