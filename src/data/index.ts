import type { Lesson, Persona, Scenario, ScenarioMeta } from '../types';
import lessonsJson from './lessons.json';
import personasJson from './personas.json';
import decliningPerformance from './scenarios/declining-performance.json';
import constructiveFeedback from './scenarios/constructive-feedback.json';
import teamConflict from './scenarios/team-conflict.json';
import upcomingJson from './scenarios/upcoming.json';

/**
 * Content registry. To add a scenario: author a JSON file that matches the Scenario
 * type, import it here, and add it to AVAILABLE. The validator (npm run validate)
 * checks the branching graph before it ships.
 */
export const PERSONAS: Persona[] = personasJson as Persona[];

export const SCENARIOS: Scenario[] = [
  decliningPerformance as unknown as Scenario,
  constructiveFeedback as unknown as Scenario,
  teamConflict as unknown as Scenario,
];

export const UPCOMING: ScenarioMeta[] = upcomingJson as ScenarioMeta[];

export const ALL_SCENARIOS: ScenarioMeta[] = [...SCENARIOS, ...UPCOMING];

export function getScenario(id: string | undefined): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getScenarioMeta(id: string | undefined): ScenarioMeta | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}

export const LESSONS: Lesson[] = lessonsJson as Lesson[];

export function getLesson(moduleId: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.moduleId === moduleId);
}

/** Module number in the course (1-based), following the library order. */
export function moduleNumber(id: string): number {
  return ALL_SCENARIOS.findIndex((s) => s.id === id) + 1;
}

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}
