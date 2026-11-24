import { ArrowDown, ArrowRight, ArrowUp, ClipboardCheck, Dumbbell, Flag, LogOut, Minus, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Button, Card, QualityBadge, cx } from '../components/ui';
import { ModuleSteps } from '../components/ModuleSteps';
import { PERSONAS, getPersona, getScenario } from '../data';
import { COMPETENCIES } from '../data/competencies';
import { finalizeAttempt } from '../engine/attempts';
import { clearSession, loadSession, saveSession } from '../engine/recommend';
import { responseEngine } from '../engine/responseEngine';
import { RAPPORT_LABEL, TRUST_MAX, TRUST_MIN, choose, createSession, getOption, maxDepth, rapportState, rewind, trustDeltaFor, type SessionState } from '../engine/simulation';
import { useApp } from '../state/AppContext';
import type { CompetencyId, DecisionNode, DecisionOption, Persona, Scenario, SimulationMode } from '../types';
import NotFound from './NotFound';

type Phase = 'choosing' | 'responding' | 'feedback' | 'complete';

/** Deterministic shuffle so the most effective option is not always in the same position. */
function orderOptions(node: DecisionNode, seed: string): DecisionOption[] {
  const h = (s: string) => [...s].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7);
  return [...node.options].sort((a, b) => h(seed + a.id) - h(seed + b.id));
}

export default function Simulator() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const scenario = getScenario(id);
  if (!scenario) return <NotFound />;
  return <SimulatorInner key={`${scenario.id}-${params.get('mode')}`} scenario={scenario} />;
}

function SimulatorInner({ scenario }: { scenario: Scenario }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { profile, saveAttempt, notify } = useApp();
  const requestedMode: SimulationMode = params.get('mode') === 'assessment' ? 'assessment' : 'practice';
  const personas = useMemo(() => scenario.personaIds.map(getPersona).filter((p): p is Persona => !!p), [scenario]);

  const [session, setSession] = useState<SessionState>(() => {
    const saved = loadSession(scenario.id);
    if (saved && saved.mode === requestedMode && saved.currentNodeId) return saved;
    return createSession(scenario, PERSONAS, requestedMode);
  });
  const [phase, setPhase] = useState<Phase>(session.currentNodeId ? 'choosing' : 'complete');
  const [selected, setSelected] = useState<string | null>(null);
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const finalized = useRef(false);
  const liveRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const mode = session.mode;
  const total = maxDepth(scenario);
  const node = session.currentNodeId ? scenario.nodes[session.currentNodeId] : undefined;
  const lastStep = session.steps[session.steps.length - 1];
  const lastOption = lastStep ? getOption(scenario, lastStep.nodeId, lastStep.optionId) : undefined;

  useEffect(() => {
    if (session.currentNodeId) saveSession(session);
  }, [session]);

  useEffect(() => {
    if (session.steps.length === 0 && phase === 'choosing') return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [phase, session.steps.length]);

  const finish = (s: SessionState) => {
    if (finalized.current) return;
    finalized.current = true;
    const attempt = finalizeAttempt(scenario, s, profile.id);
    saveAttempt(attempt);
    clearSession(scenario.id);
    setAttemptId(attempt.id);
    notify(mode === 'assessment' ? 'Assessment complete. Your result has been recorded.' : 'Practice complete. Your results are ready.');
  };

  const submit = async () => {
    if (!selected || !node) return;
    const option = node.options.find((o) => o.id === selected)!;
    const next = choose(session, scenario, PERSONAS, selected);
    setSelected(null);
    setPhase('responding');
    const turn = await responseEngine.respond({ scenario, personas, option, trust: next.trust, transcript: [] });
    window.setTimeout(() => {
      setSession(next);
      setMoods(turn.moods);
      if (mode === 'practice') setPhase('feedback');
      else if (next.currentNodeId) setPhase('choosing');
      else {
        setPhase('complete');
        finish(next);
      }
    }, 650);
  };

  const continueFromFeedback = () => {
    if (session.currentNodeId) setPhase('choosing');
    else {
      setPhase('complete');
      finish(session);
    }
  };

  const tryAgain = () => {
    setSession(rewind(session));
    setPhase('choosing');
    notify('Rewound. Try a different approach — this retry is noted in your practice record.', 'info');
  };

  const decisionNumber = Math.min(session.steps.length + (phase === 'choosing' || phase === 'responding' ? 1 : 0), total);

  return (
    <div>
      <ModuleSteps moduleId={scenario.id} current={mode} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            {mode === 'practice' ? <Dumbbell size={14} aria-hidden /> : <ClipboardCheck size={14} aria-hidden />}
            {mode === 'practice' ? 'Step 2: Practice, with feedback after each decision' : 'Step 3: Assessment, with feedback at the end'}
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{scenario.title}</h1>
        </div>
        <Link to={`/modules/${scenario.id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-sand-100 hover:text-navy-900">
          <LogOut size={16} aria-hidden /> Exit {session.steps.length > 0 && phase !== 'complete' ? '(progress saved)' : ''}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section aria-label="Conversation" className="min-w-0">
          {/* Progress */}
          <div className="mb-4 flex items-center gap-3" aria-label={`Decision ${decisionNumber} of up to ${total}`}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={cx('h-1.5 flex-1 rounded-full', i < session.steps.length ? 'bg-teal-500' : i === session.steps.length && phase !== 'complete' ? 'bg-teal-200' : 'bg-sand-200')} />
            ))}
            <span className="shrink-0 text-xs font-medium text-slate-600">
              {phase === 'complete' ? 'Conversation complete' : `Decision ${decisionNumber} of ${total}`}
            </span>
          </div>

          <Card className="overflow-hidden">
            <ol className="space-y-5 p-4 sm:p-6" aria-label="Conversation transcript">
              {session.steps.map((step, i) => {
                const n = scenario.nodes[step.nodeId];
                const o = getOption(scenario, step.nodeId, step.optionId)!;
                return (
                  <li key={`${step.nodeId}-${i}`} className="space-y-4">
                    {n.narration && <Narration text={n.narration} />}
                    <ManagerLine text={o.text} />
                    {o.reaction.map((line, j) => (
                      <EmployeeLine key={j} persona={getPersona(line.speakerId)!} text={line.text} cue={line.cue} />
                    ))}
                  </li>
                );
              })}
              {phase === 'responding' && (
                <li className="flex items-center gap-3" aria-label="Employee is responding">
                  <Avatar persona={personas[0]} size="sm" />
                  <span className="flex gap-1 rounded-2xl bg-sand-100 px-4 py-3">
                    {[0, 1, 2].map((i) => <span key={i} className="typing-dot h-2 w-2 rounded-full bg-slate-500" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </span>
                </li>
              )}
              {phase === 'choosing' && node?.narration && <li><Narration text={node.narration} /></li>}
            </ol>
            <div ref={liveRef} aria-live="polite" className="sr-only">
              {lastOption && phase !== 'responding' ? lastOption.reaction.map((l) => `${getPersona(l.speakerId)?.name} says: ${l.text}`).join(' ') : ''}
            </div>

            {phase === 'choosing' && node && (
              <DecisionPanel node={node} options={orderOptions(node, session.startedAt)} selected={selected} onSelect={setSelected} onSubmit={submit} />
            )}

            {phase === 'feedback' && lastOption && lastStep && (
              <FeedbackPanel
                option={lastOption}
                personas={personas}
                delta={personas.map((p) => ({ p, d: (lastStep.trustAfter[p.id] ?? 0) - (lastStep.trustBefore[p.id] ?? 0) }))}
                onContinue={continueFromFeedback}
                onRetry={tryAgain}
                isLast={!session.currentNodeId}
              />
            )}

            {phase === 'complete' && (
              <div className="border-t border-sand-200 bg-gradient-to-br from-teal-50 to-white p-6 text-center animate-rise">
                <Sparkles className="mx-auto mb-2 text-teal-600" aria-hidden />
                <h2 className="text-lg font-bold">The conversation has ended</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
                  {mode === 'assessment' ? 'See how your decisions shaped the outcome, with feedback on every choice.' : 'See your outcome, competency scores, and a reflection activity.'}
                </p>
                <Button className="mt-4" disabled={!attemptId} onClick={() => attemptId && navigate(`/results/${attemptId}`)}>
                  View results <ArrowRight size={16} aria-hidden />
                </Button>
              </div>
            )}
          </Card>
          <div ref={bottomRef} />
        </section>

        <aside className="order-first grid gap-4 sm:grid-cols-2 xl:order-none xl:sticky xl:top-6 xl:block xl:space-y-4 xl:self-start" aria-label="Conversation status">
          {personas.map((p) => (
            <RapportCard key={p.id} persona={p} trust={session.trust[p.id] ?? 0} mood={moods[p.id]} />
          ))}
          <Card className="p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Flag size={15} className="text-teal-700" aria-hidden /> Your objective</h2>
            <p className="text-sm leading-relaxed text-slate-700">{scenario.context.managerObjective}</p>
          </Card>
          <details className="card group p-5 sm:col-span-2 xl:col-span-1">
            <summary className="cursor-pointer list-none text-sm font-semibold">Scenario background <span className="text-xs font-normal text-slate-500">(show)</span></summary>
            <p className="mt-2 text-sm text-slate-700">{scenario.context.situation}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
              {scenario.context.whatYouKnow.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </details>
        </aside>
      </div>
    </div>
  );
}

function Narration({ text }: { text: string }) {
  return <p className="rounded-xl bg-sand-50 px-4 py-3 text-sm italic leading-relaxed text-slate-600">{text}</p>;
}

function ManagerLine({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-rise">
      <div className="max-w-[85%]">
        <p className="mb-1 text-right text-xs font-medium text-slate-500">You</p>
        <p className="rounded-2xl rounded-tr-sm bg-navy-900 px-4 py-3 text-sm leading-relaxed text-white">{/^".*"$/.test(text) ? text.slice(1, -1) : text}</p>
      </div>
    </div>
  );
}

function EmployeeLine({ persona, text, cue }: { persona: Persona; text: string; cue?: string }) {
  return (
    <div className="flex items-start gap-3 animate-rise">
      <Avatar persona={persona} size="sm" />
      <div className="max-w-[85%]">
        <p className="mb-1 text-xs font-medium text-slate-500">
          {persona.name} {cue && <span className="italic text-slate-500">— {cue}</span>}
        </p>
        <p className="rounded-2xl rounded-tl-sm border border-sand-200 bg-white px-4 py-3 text-sm leading-relaxed text-navy-900 shadow-sm">{text}</p>
      </div>
    </div>
  );
}

function DecisionPanel({ node, options, selected, onSelect, onSubmit }: { node: DecisionNode; options: DecisionOption[]; selected: string | null; onSelect: (id: string) => void; onSubmit: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), [node.id]);
  return (
    <div className="border-t border-sand-200 bg-sand-50/60 p-4 sm:p-6">
      <h2 ref={headingRef} tabIndex={-1} id="decision-prompt" className="mb-1 text-base font-bold outline-none">{node.prompt}</h2>
      <p className="mb-4 text-xs text-slate-600">Select a response, then confirm. Consider empathy, clarity, timing, and what you need from this conversation.</p>
      <div role="group" aria-labelledby="decision-prompt" className="space-y-3">
        {options.map((o, i) => {
          const isSel = selected === o.id;
          return (
            <button
              key={o.id}
              aria-pressed={isSel}
              onClick={() => onSelect(o.id)}
              className={cx(
                'flex w-full items-start gap-3 rounded-xl border bg-white p-4 text-left text-sm leading-relaxed transition',
                isSel ? 'border-teal-500 ring-2 ring-teal-500/40' : 'border-sand-200 hover:border-teal-300',
              )}
            >
              <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold', isSel ? 'bg-teal-600 text-white' : 'bg-sand-100 text-navy-800')}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="pt-0.5">{o.text}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onSubmit} disabled={!selected} className="w-full sm:w-auto">
          Respond <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function RapportCard({ persona, trust, mood }: { persona: Persona; trust: number; mood?: string }) {
  const state = rapportState(trust);
  const pct = ((trust - TRUST_MIN) / (TRUST_MAX - TRUST_MIN)) * 100;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar persona={persona} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{persona.name}</p>
          <p className="truncate text-xs text-slate-600">{persona.role}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Rapport</span>
          <span className="font-semibold text-navy-900">{RAPPORT_LABEL[state]}</span>
        </div>
        <div
          className="relative h-2 rounded-full bg-gradient-to-r from-rose-100 via-sand-200 to-teal-200"
          role="meter"
          aria-label={`Rapport with ${persona.name}`}
          aria-valuemin={TRUST_MIN}
          aria-valuemax={TRUST_MAX}
          aria-valuenow={trust}
          aria-valuetext={RAPPORT_LABEL[state]}
        >
          <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-navy-900 shadow transition-all duration-500" style={{ left: `${pct}%` }} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">{mood ?? persona.emotionalStates[state]}</p>
      </div>
    </Card>
  );
}

function FeedbackPanel({ option, personas, delta, onContinue, onRetry, isLast }: { option: DecisionOption; personas: Persona[]; delta: { p: Persona; d: number }[]; onContinue: () => void; onRetry: () => void; isLast: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const tendency = personas.map((p) => ({ p, t: p.approachResponses[option.approach] })).filter((x) => x.t);
  const rated = Object.entries(option.ratings) as [CompetencyId, number][];
  return (
    <section className="border-t border-sand-200 bg-white p-4 animate-rise sm:p-6" aria-labelledby="fb-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 ref={ref} tabIndex={-1} id="fb-heading" className="text-base font-bold outline-none">Coaching feedback</h2>
        <QualityBadge quality={option.quality} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {delta.map(({ p, d }) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-navy-800">
            {d > 0 ? <ArrowUp size={13} aria-hidden /> : d < 0 ? <ArrowDown size={13} aria-hidden /> : <Minus size={13} aria-hidden />}
            Rapport with {p.name.split(' ')[0]} {d > 0 ? `rose by ${d}` : d < 0 ? `fell by ${-d}` : 'held steady'}
          </span>
        ))}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {[
          ['What you did well', option.feedback.didWell],
          ['What could be improved', option.feedback.improve],
          ['Why it matters', option.feedback.why],
          [`How ${personas.length > 1 ? 'they' : personas[0].name.split(' ')[0]} likely heard it`, option.feedback.perception],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-sand-200 p-4">
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-700">{t}</dt>
            <dd className="text-sm leading-relaxed text-navy-900">{d}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-xl border-l-4 border-teal-500 bg-teal-50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-800">A more effective alternative</p>
        <p className="text-sm leading-relaxed text-navy-900">{option.feedback.alternative}</p>
      </div>

      <details className="mt-4 rounded-xl bg-sand-50 p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Competencies in this decision</summary>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {rated.map(([c, r]) => (
            <li key={c} className="flex items-center justify-between gap-2 text-xs">
              <span>{COMPETENCIES[c].label}</span>
              <span className="font-semibold tabular-nums" aria-label={`${r} out of 3`}>
                {'●'.repeat(r)}
                <span className="text-sand-300">{'●'.repeat(3 - r)}</span> {r}/3
              </span>
            </li>
          ))}
        </ul>
        {tendency.map(({ p, t }) => (
          <p key={p.id} className="mt-3 text-xs text-slate-600">
            <span className="font-semibold text-navy-800">Persona insight — {p.name}:</span> {t!.tendency}
          </p>
        ))}
        <p className="mt-2 text-xs text-slate-500">Persona-adjusted rapport change: {delta.map(({ p }) => `${p.name.split(' ')[0]} ${trustDeltaFor(option, p) >= 0 ? '+' : ''}${trustDeltaFor(option, p)}`).join(', ')}</p>
      </details>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onRetry}>
          <RotateCcw size={16} aria-hidden /> Try a different response
        </Button>
        <Button onClick={onContinue}>
          {isLast ? 'End conversation' : 'Continue conversation'} <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </section>
  );
}
