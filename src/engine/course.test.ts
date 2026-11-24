import { describe, expect, it } from 'vitest';
import { LESSONS, SCENARIOS } from '../data';
import { courseProgress, moduleSteps, nextStep } from './course';

describe('lessons', () => {
  it('every available module has a lesson, each with a different activity type', () => {
    expect(SCENARIOS.map((s) => !!LESSONS.find((l) => l.moduleId === s.id))).toEqual(SCENARIOS.map(() => true));
    expect(new Set(LESSONS.map((l) => l.activity.type)).size).toBe(LESSONS.length);
  });
  it('activity answer keys are valid', () => {
    for (const l of LESSONS) {
      const a = l.activity;
      if (a.type === 'sort') for (const i of a.items) expect(a.bins.map((b) => b.id)).toContain(i.bin);
      if (a.type === 'build') for (const r of a.rounds) {
        expect(r.parts.map((p) => p.part)).toEqual(['situation', 'behavior', 'impact']);
        for (const p of r.parts) expect(p.options.filter((o) => o.correct)).toHaveLength(1);
      }
      if (a.type === 'match') for (const i of a.items) expect(i.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });
});

describe('course progress', () => {
  const id = SCENARIOS[0].id;
  const base = { attempts: [], reflections: [], lessons: [] };
  it('tracks each step independently and completes a module when all four are done', () => {
    const r = {
      attempts: [
        { id: '1', userId: 'u', scenarioId: id, mode: 'assessment' as const, startedAt: '1', completedAt: '2', decisions: [], overallScore: 80 },
      ],
      reflections: [{ id: 'r', userId: 'u', createdAt: '3', updatedAt: '3', scenarioId: id, prompt: 'p', text: 't' }],
      lessons: [{ moduleId: id, completedAt: '0', correct: 7, total: 8 }],
    };
    expect(moduleSteps(id, r).map((s) => s.done)).toEqual([true, false, true, true]);
    expect(nextStep(r)).toMatchObject({ step: 'practice' });
    r.attempts.push({ ...r.attempts[0], id: '2', mode: 'practice' as never });
    expect(courseProgress(r).modulesComplete).toBe(1);
  });
  it('starts at Module 1 lesson', () => {
    expect(nextStep(base)).toMatchObject({ step: 'lesson' });
    expect(courseProgress(base).stepsTotal).toBe(12);
  });
});
