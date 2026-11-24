import { SCENARIOS } from '../data';
import type { LessonResult, Reflection, Scenario, SimulationAttempt } from '../types';

export type StepId = 'lesson' | 'practice' | 'assessment' | 'reflection';

export interface ModuleStep {
  id: StepId;
  label: string;
  done: boolean;
  /** Short status line, e.g. "Best score 82" */
  detail?: string;
}

export const STEP_LABELS: Record<StepId, string> = {
  lesson: 'Lesson',
  practice: 'Practice',
  assessment: 'Assessment',
  reflection: 'Reflection',
};

export const STEP_ORDER: StepId[] = ['lesson', 'practice', 'assessment', 'reflection'];

export interface CourseRecords {
  attempts: SimulationAttempt[];
  reflections: Reflection[];
  lessons: LessonResult[];
}

/** Step status for one module. Steps are all open; each is tracked independently. */
export function moduleSteps(moduleId: string, r: CourseRecords): ModuleStep[] {
  const done = r.attempts.filter((a) => a.scenarioId === moduleId && a.completedAt);
  const practice = done.filter((a) => a.mode === 'practice');
  const assessment = done.filter((a) => a.mode === 'assessment');
  const lesson = r.lessons.find((l) => l.moduleId === moduleId);
  const reflections = r.reflections.filter((x) => x.scenarioId === moduleId);
  const best = (list: SimulationAttempt[]) => Math.max(...list.map((a) => a.overallScore ?? 0));
  return [
    { id: 'lesson', label: STEP_LABELS.lesson, done: !!lesson, detail: lesson ? `${lesson.correct} of ${lesson.total} correct on first try` : undefined },
    { id: 'practice', label: STEP_LABELS.practice, done: practice.length > 0, detail: practice.length ? `${practice.length} run${practice.length > 1 ? 's' : ''}, best ${best(practice)}` : undefined },
    { id: 'assessment', label: STEP_LABELS.assessment, done: assessment.length > 0, detail: assessment.length ? `Best score ${best(assessment)}` : undefined },
    { id: 'reflection', label: STEP_LABELS.reflection, done: reflections.length > 0, detail: reflections.length ? `${reflections.length} entr${reflections.length > 1 ? 'ies' : 'y'}` : undefined },
  ];
}

export function isModuleComplete(moduleId: string, r: CourseRecords): boolean {
  return moduleSteps(moduleId, r).every((s) => s.done);
}

export function courseProgress(r: CourseRecords) {
  const modules = SCENARIOS.map((s) => ({ scenario: s, steps: moduleSteps(s.id, r) }));
  const stepsDone = modules.reduce((n, m) => n + m.steps.filter((s) => s.done).length, 0);
  const stepsTotal = modules.length * STEP_ORDER.length;
  const modulesComplete = modules.filter((m) => m.steps.every((s) => s.done)).length;
  return { modules, stepsDone, stepsTotal, modulesComplete, percent: Math.round((stepsDone / stepsTotal) * 100), complete: modulesComplete === modules.length };
}

/** The route for a module step. */
export function stepPath(moduleId: string, step: StepId): string {
  switch (step) {
    case 'lesson':
      return `/modules/${moduleId}/lesson`;
    case 'practice':
      return `/simulate/${moduleId}?mode=practice`;
    case 'assessment':
      return `/simulate/${moduleId}?mode=assessment`;
    case 'reflection':
      return `/modules/${moduleId}/reflect`;
  }
}

/** Next unfinished step, preferring modules already in progress. */
export function nextStep(r: CourseRecords): { scenario: Scenario; step: StepId } | null {
  const { modules } = courseProgress(r);
  const inProgress = modules.find((m) => m.steps.some((s) => s.done) && m.steps.some((s) => !s.done));
  const target = inProgress ?? modules.find((m) => m.steps.some((s) => !s.done));
  if (!target) return null;
  return { scenario: target.scenario, step: target.steps.find((s) => !s.done)!.id };
}
