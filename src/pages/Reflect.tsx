import { Target } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ModuleSteps } from '../components/ModuleSteps';
import { Card, formatDate } from '../components/ui';
import { getScenario, moduleNumber } from '../data';
import { useApp } from '../state/AppContext';
import NotFound from './NotFound';
import { ReflectionForm } from './Results';

const PROMPTS: Record<string, string[]> = {
  'declining-performance': ['When a strong performer struggles, do you tend to lead with facts, reassurance, or curiosity?', 'Who on your team might benefit from a check-in this week?'],
  'constructive-feedback': ['Think of feedback you have been putting off. What is the Situation, Behavior, and Impact?', 'When do you soften feedback until the message gets lost?'],
  'team-conflict': ['Think of a disagreement on your team. What might each person\'s underlying interest be?', 'How do you stay impartial when you privately agree with one side?'],
};

export default function Reflect() {
  const { id } = useParams();
  const scenario = getScenario(id);
  const { reflections, attempts } = useApp();
  if (!scenario) return <NotFound />;
  const latest = attempts.filter((a) => a.scenarioId === scenario.id && a.completedAt).sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1))[0];
  const mine = reflections.filter((r) => r.scenarioId === scenario.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div>
      <Link to={`/modules/${scenario.id}`} className="mb-4 inline-block text-sm font-semibold text-teal-700 hover:underline">← Module {moduleNumber(scenario.id)}: {scenario.title}</Link>
      <ModuleSteps moduleId={scenario.id} current="reflection" />
      <header className="mb-6">
        <p className="eyebrow mb-2">Step 4: Reflection</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Bring it back to your workplace</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-slate-600">Practice only changes behavior when you connect it to real conversations. Take a few minutes to think about your own approach, then commit to one specific behavior.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReflectionForm key={mine.length} scenarioId={scenario.id} attemptId={latest?.id} heading="Your reflection" eyebrow={`Module ${moduleNumber(scenario.id)}: ${scenario.shortTitle}`} />
        </div>
        <div className="space-y-6">
          <Card as="section" className="p-6" aria-labelledby="think">
            <h2 id="think" className="mb-3 text-base font-bold">Questions to consider</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              {(PROMPTS[scenario.id] ?? []).map((p) => <li key={p}>{p}</li>)}
              <li>Which key principle from this module was hardest for you, and why?</li>
            </ul>
            <ul className="mt-4 space-y-1.5 border-t border-sand-100 pt-4 text-xs text-slate-600">
              {scenario.keyPrinciples.map((k) => <li key={k}>• {k}</li>)}
            </ul>
          </Card>
          {mine.length > 0 && (
            <Card as="section" className="p-6" aria-labelledby="prev">
              <h2 id="prev" className="mb-3 text-base font-bold">Your reflections for this module</h2>
              <ul className="space-y-3">
                {mine.map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                    {r.commitment && <p className="mt-1 flex gap-2"><Target size={14} className="mt-0.5 shrink-0 text-teal-700" aria-hidden />{r.commitment}</p>}
                  </li>
                ))}
              </ul>
              <Link to="/journal" className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:underline">Open your journal</Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
