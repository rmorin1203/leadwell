import { finalizeAttempt, simulatePath, uid } from '../engine/attempts';
import type { LessonResult, Reflection, SimulationAttempt } from '../types';
import { getScenario } from '.';

const daysAgo = (d: number, h = 10) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 15, 0, 0);
  return t.toISOString();
};

/** Fictional learning history so the dashboard can be demonstrated in a populated state. */
export function buildSampleHistory(userId: string): { attempts: SimulationAttempt[]; reflections: Reflection[]; lessons: LessonResult[] } {
  const dp = getScenario('declining-performance')!;
  const cf = getScenario('constructive-feedback')!;
  const byId = (ids: string[]) => (_opts: unknown, depth: number) => ids[depth];

  const a1Session = simulatePath(dp, 'practice', byId(['open-direct', 'guarded-facts', 'vague-accept']));
  a1Session.startedAt = daysAgo(12, 9);
  const a1 = finalizeAttempt(dp, a1Session, userId, uid(), daysAgo(12));

  const a2Session = simulatePath(dp, 'assessment', byId(['open-checkin', 'up-deadlines', 'vague-respect']));
  a2Session.startedAt = daysAgo(8, 14);
  const a2 = finalizeAttempt(dp, a2Session, userId, uid(), daysAgo(8, 14));

  const a3Session = simulatePath(cf, 'practice', byId(['open-sandwich', 'praised-email', 'push-firm']));
  a3Session.startedAt = daysAgo(3, 16);
  const a3 = finalizeAttempt(cf, a3Session, userId, uid(), daysAgo(3, 16));

  const reflections: Reflection[] = [
    {
      id: uid(), userId, createdAt: daysAgo(12, 11), updatedAt: daysAgo(12, 11), scenarioId: dp.id, attemptId: a1.id,
      prompt: 'What is one behavior you will apply in your next workplace conversation?',
      text: 'I jumped to the facts before asking how Maya was doing. I tend to do this when I am nervous about a conversation.',
      commitment: 'Open my next 1:1 about performance with an observation and a genuine question.',
    },
    {
      id: uid(), userId, createdAt: daysAgo(3, 17), updatedAt: daysAgo(3, 17), scenarioId: cf.id, attemptId: a3.id,
      prompt: 'What is one behavior you will apply in your next workplace conversation?',
      text: 'I softened the feedback so much that the real message got lost. Being kind is not the same as being vague.',
      commitment: 'Write my feedback in SBI format before my next 1:1 and lead with it.',
    },
  ];
  const lessons: LessonResult[] = [
    { moduleId: dp.id, completedAt: daysAgo(13, 9), correct: 6, total: 8 },
    { moduleId: cf.id, completedAt: daysAgo(4, 15), correct: 4, total: 6 },
  ];
  return { attempts: [a1, a2, a3], reflections, lessons };
}
