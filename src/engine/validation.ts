import { COMPETENCY_ORDER } from '../data/competencies';
import type { Persona, Scenario } from '../types';

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface ValidationReport {
  scenarioId: string;
  issues: ValidationIssue[];
  nodeCount: number;
  optionCount: number;
  pathCount: number;
  minDecisionsPerPath: number;
  maxDecisionsPerPath: number;
  outcomeCount: number;
}

/** Checks the integrity of a scenario's branching graph and content. */
export function validateScenario(s: Scenario, personas: Persona[]): ValidationReport {
  const issues: ValidationIssue[] = [];
  const err = (message: string) => issues.push({ level: 'error', message });
  const warn = (message: string) => issues.push({ level: 'warning', message });
  const validComps = new Set<string>(COMPETENCY_ORDER);

  if (!s.nodes[s.startNodeId]) err(`Start node "${s.startNodeId}" does not exist.`);
  for (const pid of s.personaIds) if (!personas.some((p) => p.id === pid)) err(`Unknown persona "${pid}".`);
  for (const c of s.competencies) if (!validComps.has(c)) err(`Unknown competency "${c}".`);
  if (s.objectives.length < 2) warn('Fewer than two learning objectives.');

  let optionCount = 0;
  const usedOutcomes = new Set<string>();
  for (const node of Object.values(s.nodes)) {
    if (node.options.length < 3) err(`Node "${node.id}" has fewer than three options.`);
    const qualities = new Set(node.options.map((o) => o.quality));
    if (qualities.size < 2) warn(`Node "${node.id}" options all have the same quality.`);
    for (const o of node.options) {
      optionCount++;
      if (o.next !== null && !s.nodes[o.next]) err(`Option "${o.id}" points to missing node "${o.next}".`);
      if (o.next === null) {
        if (!o.outcome || !s.outcomes[o.outcome]) err(`Terminal option "${o.id}" has no valid outcome.`);
        else usedOutcomes.add(o.outcome);
      }
      if (!o.reaction.length) err(`Option "${o.id}" has no employee reaction.`);
      for (const line of o.reaction)
        if (!s.personaIds.includes(line.speakerId)) err(`Option "${o.id}" reaction uses unknown speaker "${line.speakerId}".`);
      for (const [c, r] of Object.entries(o.ratings)) {
        if (!validComps.has(c)) err(`Option "${o.id}" rates unknown competency "${c}".`);
        if (r < 0 || r > 3) err(`Option "${o.id}" rating for ${c} is out of range (0–3).`);
      }
      if (!Object.keys(o.ratings).length) err(`Option "${o.id}" has no competency ratings.`);
      const fb = o.feedback;
      for (const k of ['didWell', 'improve', 'why', 'perception', 'alternative'] as const)
        if (!fb?.[k]?.trim()) err(`Option "${o.id}" is missing feedback field "${k}".`);
    }
  }
  for (const id of Object.keys(s.outcomes)) if (!usedOutcomes.has(id)) warn(`Outcome "${id}" is never reached.`);

  // Enumerate all paths; detect cycles and unreachable nodes.
  const reached = new Set<string>();
  const depths: number[] = [];
  const walk = (nodeId: string, depth: number, stack: string[]) => {
    if (stack.includes(nodeId)) {
      err(`Cycle detected: ${[...stack, nodeId].join(' → ')}`);
      return;
    }
    const node = s.nodes[nodeId];
    if (!node) return;
    reached.add(nodeId);
    for (const o of node.options) {
      if (o.next === null) depths.push(depth + 1);
      else walk(o.next, depth + 1, [...stack, nodeId]);
    }
  };
  if (s.nodes[s.startNodeId]) walk(s.startNodeId, 0, []);
  for (const id of Object.keys(s.nodes)) if (!reached.has(id)) warn(`Node "${id}" is unreachable.`);

  const minD = depths.length ? Math.min(...depths) : 0;
  if (minD < 3) err(`Some paths have fewer than three decision points (minimum ${minD}).`);

  return {
    scenarioId: s.id,
    issues,
    nodeCount: Object.keys(s.nodes).length,
    optionCount,
    pathCount: depths.length,
    minDecisionsPerPath: minD,
    maxDecisionsPerPath: depths.length ? Math.max(...depths) : 0,
    outcomeCount: Object.keys(s.outcomes).length,
  };
}
