import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ModuleSteps } from '../components/ModuleSteps';
import { Button, Card, LinkButton, cx } from '../components/ui';
import { getLesson, getScenario, moduleNumber } from '../data';
import { stepPath } from '../engine/course';
import { useApp } from '../state/AppContext';
import type { BuildActivity, Lesson, MatchActivity, SortActivity } from '../types';
import NotFound from './NotFound';

type Finish = (correct: number, total: number) => void;

export default function LessonPage() {
  const { id } = useParams();
  const lesson = getLesson(id);
  const scenario = getScenario(id);
  if (!lesson || !scenario) return <NotFound />;
  return <LessonInner key={lesson.moduleId} lesson={lesson} title={scenario.title} />;
}

function LessonInner({ lesson, title }: { lesson: Lesson; title: string }) {
  const { saveLessonResult, notify } = useApp();
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [run, setRun] = useState(0);
  const resultRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const finish: Finish = (correct, total) => {
    setResult({ correct, total });
    saveLessonResult({ moduleId: lesson.moduleId, correct, total });
    notify('Lesson complete. Step 1 is checked off.');
  };

  const a = lesson.activity;
  return (
    <div>
      <Link to={`/modules/${lesson.moduleId}`} className="mb-4 inline-block text-sm font-semibold text-teal-700 hover:underline">← Module {moduleNumber(lesson.moduleId)}: {title}</Link>
      <ModuleSteps moduleId={lesson.moduleId} current="lesson" />

      <header className="mb-6">
        <p className="eyebrow mb-2">Step 1: Lesson</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{lesson.title}</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card as="section" className="h-fit p-6 xl:col-span-2" aria-labelledby="concept">
          <h2 id="concept" className="mb-3 text-lg font-bold">The idea</h2>
          <p className="text-sm leading-relaxed text-slate-700">{lesson.concept.intro}</p>
          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-teal-700">{lesson.concept.model.name}</h3>
          <ol className="space-y-3">
            {lesson.concept.model.steps.map((s, i) => (
              <li key={s.label} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">{i + 1}</span>
                <span className="text-sm"><span className="font-semibold">{s.label}.</span> {s.text}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card as="section" className="p-6 xl:col-span-3" aria-labelledby="activity">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="activity" className="text-lg font-bold">Try it</h2>
            {result && (
              <Button variant="ghost" onClick={() => { setResult(null); setRun((r) => r + 1); }}>
                <RotateCcw size={15} aria-hidden /> Try the activity again
              </Button>
            )}
          </div>
          <p className="mb-5 text-sm text-slate-600">{a.instructions}</p>
          {a.type === 'sort' && <SortActivityView key={run} activity={a} onFinish={finish} />}
          {a.type === 'build' && <BuildActivityView key={run} activity={a} onFinish={finish} />}
          {a.type === 'match' && <MatchActivityView key={run} activity={a} onFinish={finish} />}

          {result && (
            <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5 animate-rise">
              <h3 ref={resultRef} tabIndex={-1} className="flex items-center gap-2 text-base font-bold outline-none">
                <CheckCircle2 size={18} className="text-teal-700" aria-hidden /> Lesson complete: {result.correct} of {result.total} correct on the first try
              </h3>
              <p className="mt-2 flex gap-2 text-sm text-navy-900"><Lightbulb size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden /> {lesson.takeaway}</p>
              <LinkButton to={stepPath(lesson.moduleId, 'practice')} className="mt-4">
                Continue to practice <ArrowRight size={16} aria-hidden />
              </LinkButton>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div role="status" className={cx('mt-3 flex gap-2 rounded-lg p-3 text-sm', ok ? 'bg-teal-50 text-navy-900' : 'bg-rose-50 text-navy-900')}>
      {ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-teal-700" aria-hidden /> : <XCircle size={17} className="mt-0.5 shrink-0 text-rose-700" aria-hidden />}
      <span><span className="font-semibold">{ok ? 'Correct.' : 'Not quite.'}</span> {children}</span>
    </div>
  );
}

function Counter({ n, total, label }: { n: number; total: number; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200" aria-hidden>
        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(n / total) * 100}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{label} {Math.min(n + 1, total)} of {total}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module 1: sort statements into bins
// ---------------------------------------------------------------------------
function SortActivityView({ activity, onFinish }: { activity: SortActivity; onFinish: Finish }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const item = activity.items[index];
  const answered = item ? answers[item.id] : undefined;
  const done = index >= activity.items.length;
  const correct = activity.items.filter((i) => answers[i.id] === i.bin).length;

  const next = () => {
    if (index + 1 >= activity.items.length) {
      setIndex(index + 1);
      onFinish(correct, activity.items.length);
    } else setIndex(index + 1);
  };

  return (
    <div>
      {!done && (
        <>
          <Counter n={index} total={activity.items.length} label="Statement" />
          <div className="rounded-xl border border-sand-200 bg-sand-50 p-5">
            <p className="text-base font-medium leading-relaxed">{item.text}</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2" role="group" aria-label="Choose a column">
            {activity.bins.map((b) => {
              const picked = answered === b.id;
              const isRight = answered && b.id === item.bin;
              return (
                <button
                  key={b.id}
                  disabled={!!answered}
                  onClick={() => setAnswers({ ...answers, [item.id]: b.id })}
                  className={cx(
                    'min-h-[48px] rounded-xl border px-4 text-sm font-semibold transition',
                    !answered && 'border-sand-300 bg-white hover:border-teal-400 hover:bg-teal-50',
                    isRight && 'border-teal-500 bg-teal-50 text-teal-800',
                    picked && !isRight && 'border-rose-300 bg-rose-50 text-rose-700',
                    answered && !picked && !isRight && 'border-sand-200 bg-white text-slate-400',
                  )}
                >
                  {b.label}
                  {isRight && <span className="sr-only"> (correct column)</span>}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <Verdict ok={answered === item.bin}>{item.explanation}</Verdict>
              <div className="mt-4 flex justify-end">
                <Button onClick={next}>{index + 1 >= activity.items.length ? 'Finish activity' : 'Next statement'} <ArrowRight size={16} aria-hidden /></Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Sorted columns */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {activity.bins.map((b) => {
          const list = activity.items.filter((i) => answers[i.id] && i.bin === b.id);
          return (
            <div key={b.id} className="rounded-xl border border-dashed border-sand-300 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{b.label} ({list.length})</p>
              <ul className="space-y-2">
                {list.map((i) => (
                  <li key={i.id} className="flex gap-2 rounded-lg bg-white p-2 text-xs shadow-sm">
                    {answers[i.id] === i.bin ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-700" aria-label="You sorted this correctly" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-rose-700" aria-label="You sorted this into the other column" />}
                    <span className="text-slate-700">{i.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module 2: build SBI feedback from parts
// ---------------------------------------------------------------------------
const PART_LABEL = { situation: 'Situation', behavior: 'Behavior', impact: 'Impact' };

function BuildActivityView({ activity, onFinish }: { activity: BuildActivity; onFinish: Finish }) {
  const [round, setRound] = useState(0);
  const [part, setPart] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const total = activity.rounds.length * 3;

  if (round >= activity.rounds.length) return <p className="text-sm text-slate-600">All feedback statements built.</p>;
  const r = activity.rounds[round];
  const p = r.parts[part];
  const roundDone = part >= r.parts.length;
  const solved = !roundDone && tried.some((id) => p.options.find((o) => o.id === id)?.correct);
  const last = tried.length ? p?.options.find((o) => o.id === tried[tried.length - 1]) : undefined;

  const pick = (id: string) => {
    if (solved || tried.includes(id)) return;
    const opt = p.options.find((o) => o.id === id)!;
    if (opt.correct && tried.length === 0) setFirstTry((n) => n + 1);
    if (opt.correct) setBuilt((b) => [...b, opt.text]);
    setTried((t) => [...t, id]);
  };

  const nextPart = () => {
    setTried([]);
    setPart(part + 1);
  };

  const nextRound = () => {
    if (round + 1 >= activity.rounds.length) {
      setRound(round + 1);
      onFinish(firstTry, total);
      return;
    }
    setRound(round + 1);
    setPart(0);
    setTried([]);
    setBuilt([]);
  };

  return (
    <div>
      <p className="mb-3 text-xs font-medium text-slate-600">Round {round + 1} of {activity.rounds.length}</p>
      <div className="rounded-xl border border-sand-200 bg-sand-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vague comment</p>
        <p className="mt-1 text-base font-medium line-through decoration-rose-400/70">{r.vague}</p>
        <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-navy-900">What happened:</span> {r.context}</p>
      </div>

      {/* Statement being built */}
      <div className="mt-4 rounded-xl border-2 border-dashed border-teal-300 p-4" aria-live="polite">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">Your SBI feedback</p>
        <div className="flex flex-wrap gap-2">
          {r.parts.map((pp, i) => (
            <span key={pp.part} className={cx('rounded-lg px-3 py-2 text-sm', built[i] ? 'bg-teal-50 text-navy-900' : 'bg-sand-100 text-slate-500')}>
              <span className="mr-1 text-xs font-bold uppercase text-teal-700">{PART_LABEL[pp.part][0]}</span>
              {built[i] ?? `${PART_LABEL[pp.part]}…`}
            </span>
          ))}
        </div>
      </div>

      {!roundDone ? (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-bold">Choose the best {PART_LABEL[p.part].toLowerCase()}</h3>
          <div className="space-y-2" role="group" aria-label={`${PART_LABEL[p.part]} options`}>
            {p.options.map((o) => {
              const wasTried = tried.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => pick(o.id)}
                  disabled={solved || wasTried}
                  className={cx(
                    'w-full rounded-xl border p-3 text-left text-sm transition',
                    wasTried && o.correct && 'border-teal-500 bg-teal-50',
                    wasTried && !o.correct && 'border-rose-200 bg-rose-50 text-slate-500 line-through',
                    !wasTried && !solved && 'border-sand-200 bg-white hover:border-teal-300',
                    !wasTried && solved && 'border-sand-200 bg-white text-slate-400',
                  )}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
          {last && <Verdict ok={last.correct}>{last.feedback}{!last.correct && ' Try another option.'}</Verdict>}
          {solved && (
            <div className="mt-4 flex justify-end">
              <Button onClick={nextPart}>{part + 1 >= r.parts.length ? 'See the full statement' : `Next: ${PART_LABEL[r.parts[part + 1].part]}`} <ArrowRight size={16} aria-hidden /></Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 animate-rise">
          <h3 className="mb-2 text-sm font-bold">Your finished SBI feedback</h3>
          <p className="rounded-xl bg-navy-900 p-4 text-sm leading-relaxed text-white">"{built.map((t) => t.replace(/^"|"$/g, '').replace(/^…|…$/g, '').trim()).join(', ')}"</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={nextRound}>{round + 1 >= activity.rounds.length ? 'Finish activity' : 'Next round'} <ArrowRight size={16} aria-hidden /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module 3: match positions to underlying interests
// ---------------------------------------------------------------------------
function MatchActivityView({ activity, onFinish }: { activity: MatchActivity; onFinish: Finish }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const done = index >= activity.items.length;
  const item = activity.items[index];
  const answered = item ? answers[item.id] : undefined;
  const correctOpt = item?.options.find((o) => o.correct);
  const correct = activity.items.filter((i) => i.options.find((o) => o.id === answers[i.id])?.correct).length;

  const next = () => {
    setIndex(index + 1);
    if (index + 1 >= activity.items.length) onFinish(correct, activity.items.length);
  };

  return (
    <div>
      {!done && (
        <>
          <Counter n={index} total={activity.items.length} label="Position" />
          <div className="rounded-xl border border-sand-200 bg-sand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.speaker} says</p>
            <p className="mt-1 text-base font-medium">{item.position}</p>
          </div>
          <h3 className="mb-2 mt-5 text-sm font-bold">What is the most likely underlying interest?</h3>
          <div className="space-y-2" role="group" aria-label="Underlying interest options">
            {item.options.map((o) => {
              const picked = answered === o.id;
              return (
                <button
                  key={o.id}
                  disabled={!!answered}
                  onClick={() => setAnswers({ ...answers, [item.id]: o.id })}
                  className={cx(
                    'w-full rounded-xl border p-3 text-left text-sm transition',
                    !answered && 'border-sand-200 bg-white hover:border-teal-300',
                    answered && o.correct && 'border-teal-500 bg-teal-50',
                    picked && !o.correct && 'border-rose-200 bg-rose-50',
                    answered && !picked && !o.correct && 'border-sand-200 bg-white text-slate-400',
                  )}
                >
                  {o.text}
                  {answered && o.correct && <span className="sr-only"> (correct answer)</span>}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <Verdict ok={answered === correctOpt?.id}>{item.explanation}</Verdict>
              <div className="mt-4 flex justify-end">
                <Button onClick={next}>{index + 1 >= activity.items.length ? 'Finish activity' : 'Next position'} <ArrowRight size={16} aria-hidden /></Button>
              </div>
            </>
          )}
        </>
      )}
      {done && (
        <ul className="space-y-2">
          {activity.items.map((i) => {
            const ok = i.options.find((o) => o.id === answers[i.id])?.correct;
            return (
              <li key={i.id} className="flex gap-2 rounded-lg border border-sand-200 p-3 text-sm">
                {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal-700" aria-label="Correct" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-rose-700" aria-label="Incorrect" />}
                <span><span className="font-medium">{i.position}</span> <span className="text-slate-600">Interest: {i.options.find((o) => o.correct)?.text}</span></span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
