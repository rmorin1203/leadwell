import type { DecisionNode, DecisionOption, Persona, RapportState, Scenario, ScenarioOutcome, SimulationMode } from '../types';

/**
 * The branching conversation engine. Pure functions over a serialisable SessionState,
 * so sessions can be persisted, replayed, and later driven by an AI response engine.
 */

export interface SessionStep {
  nodeId: string;
  optionId: string;
  trustBefore: Record<string, number>;
  trustAfter: Record<string, number>;
}

export interface SessionState {
  scenarioId: string;
  mode: SimulationMode;
  currentNodeId: string | null;
  steps: SessionStep[];
  trust: Record<string, number>;
  retries: Record<string, number>;
  outcomeId: string | null;
  startedAt: string;
}

export const TRUST_MIN = -5;
export const TRUST_MAX = 5;

const clamp = (n: number) => Math.max(TRUST_MIN, Math.min(TRUST_MAX, n));

export function createSession(scenario: Scenario, personas: Persona[], mode: SimulationMode): SessionState {
  const trust: Record<string, number> = {};
  for (const id of scenario.personaIds) {
    trust[id] = personas.find((p) => p.id === id)?.baselineTrust ?? 0;
  }
  return {
    scenarioId: scenario.id,
    mode,
    currentNodeId: scenario.startNodeId,
    steps: [],
    trust,
    retries: {},
    outcomeId: null,
    startedAt: new Date().toISOString(),
  };
}

/** Persona-adjusted change in rapport for a given choice. */
export function trustDeltaFor(option: DecisionOption, persona: Persona | undefined): number {
  const modifier = persona?.approachResponses[option.approach]?.trustModifier ?? 0;
  return option.trust + modifier;
}

export function getNode(scenario: Scenario, nodeId: string | null): DecisionNode | undefined {
  return nodeId ? scenario.nodes[nodeId] : undefined;
}

export function getOption(scenario: Scenario, nodeId: string, optionId: string): DecisionOption | undefined {
  return scenario.nodes[nodeId]?.options.find((o) => o.id === optionId);
}

export function choose(state: SessionState, scenario: Scenario, personas: Persona[], optionId: string): SessionState {
  if (!state.currentNodeId) throw new Error('Session is already complete.');
  const node = scenario.nodes[state.currentNodeId];
  const option = node?.options.find((o) => o.id === optionId);
  if (!node || !option) throw new Error(`Unknown option ${optionId} at node ${state.currentNodeId}`);

  const trustAfter: Record<string, number> = {};
  for (const [pid, value] of Object.entries(state.trust)) {
    trustAfter[pid] = clamp(value + trustDeltaFor(option, personas.find((p) => p.id === pid)));
  }

  return {
    ...state,
    steps: [...state.steps, { nodeId: node.id, optionId, trustBefore: state.trust, trustAfter }],
    trust: trustAfter,
    currentNodeId: option.next,
    outcomeId: option.next === null ? option.outcome ?? null : null,
  };
}

/** Practice mode only: rewind the most recent decision so the learner can try another approach. */
export function rewind(state: SessionState): SessionState {
  const last = state.steps[state.steps.length - 1];
  if (!last || state.mode !== 'practice') return state;
  return {
    ...state,
    steps: state.steps.slice(0, -1),
    trust: last.trustBefore,
    currentNodeId: last.nodeId,
    outcomeId: null,
    retries: { ...state.retries, [last.nodeId]: (state.retries[last.nodeId] ?? 0) + 1 },
  };
}

export function isComplete(state: SessionState): boolean {
  return state.currentNodeId === null && state.outcomeId !== null;
}

export function getOutcome(scenario: Scenario, state: SessionState): ScenarioOutcome | undefined {
  return state.outcomeId ? scenario.outcomes[state.outcomeId] : undefined;
}

export function rapportState(trust: number): RapportState {
  if (trust >= 3) return 'open';
  if (trust >= 1) return 'receptive';
  if (trust >= -1) return 'guarded';
  return 'closed';
}

export const RAPPORT_LABEL: Record<RapportState, string> = {
  open: 'Open',
  receptive: 'Receptive',
  guarded: 'Guarded',
  closed: 'Closed',
};

/** Longest number of decisions on any path — used for progress display. */
export function maxDepth(scenario: Scenario, nodeId = scenario.startNodeId, seen = new Set<string>()): number {
  if (seen.has(nodeId)) return 0;
  const node = scenario.nodes[nodeId];
  if (!node) return 0;
  const next = new Set(seen).add(nodeId);
  return 1 + Math.max(0, ...node.options.map((o) => (o.next ? maxDepth(scenario, o.next, next) : 0)));
}
