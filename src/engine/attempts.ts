import { PERSONAS } from '../data';
import type { Scenario, SimulationAttempt, SimulationMode } from '../types';
import { choose, createSession, type SessionState } from './simulation';
import { scorePath } from './scoring';

export const uid = (): string =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/** Converts a completed session into a scored, persistable attempt. */
export function finalizeAttempt(scenario: Scenario, session: SessionState, userId: string, id = uid(), completedAt = new Date().toISOString()): SimulationAttempt {
  const score = scorePath(scenario, session.steps);
  return {
    id,
    userId,
    scenarioId: scenario.id,
    mode: session.mode,
    startedAt: session.startedAt,
    completedAt,
    decisions: session.steps.map((s) => ({
      nodeId: s.nodeId,
      optionId: s.optionId,
      trustAfter: Math.round(Object.values(s.trustAfter).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(s.trustAfter).length)),
      retries: session.retries[s.nodeId] ?? 0,
    })),
    outcomeId: session.outcomeId ?? undefined,
    overallScore: score.overall,
    competencyScores: score.competencies,
    finalTrust: Math.round(Object.values(session.trust).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(session.trust).length)),
  };
}

/** Plays a scenario with a choice function — used for sample history and the fictional cohort. */
export function simulatePath(
  scenario: Scenario,
  mode: SimulationMode,
  pick: (options: Scenario['nodes'][string]['options'], depth: number) => string,
): SessionState {
  let st = createSession(scenario, PERSONAS, mode);
  let depth = 0;
  while (st.currentNodeId) {
    const node = scenario.nodes[st.currentNodeId];
    st = choose(st, scenario, PERSONAS, pick(node.options, depth++));
  }
  return st;
}
