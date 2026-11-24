import { COMPETENCY_ORDER } from '../data/competencies';
import type { CompetencyId, DecisionOption, ResponseQuality, Scenario, SimulationAttempt } from '../types';

export interface ScoreBreakdown {
  overall: number;
  competencies: Partial<Record<CompetencyId, number>>;
  strengths: CompetencyId[];
  growthAreas: CompetencyId[];
  qualityCounts: Record<ResponseQuality, number>;
}

const MAX_RATING = 3;

/**
 * Scores a path through a scenario. Each decision rates 0–3 on the competencies it
 * assesses; competency scores are the percentage of available points earned across all
 * decisions that assessed that competency. The overall score is the mean decision score.
 */
export function scorePath(scenario: Scenario, choices: { nodeId: string; optionId: string }[]): ScoreBreakdown {
  const earned: Partial<Record<CompetencyId, number>> = {};
  const possible: Partial<Record<CompetencyId, number>> = {};
  const qualityCounts: Record<ResponseQuality, number> = { effective: 0, partial: 0, limited: 0 };
  const decisionScores: number[] = [];

  for (const { nodeId, optionId } of choices) {
    const option: DecisionOption | undefined = scenario.nodes[nodeId]?.options.find((o) => o.id === optionId);
    if (!option) continue;
    qualityCounts[option.quality] += 1;
    let e = 0;
    let p = 0;
    for (const [comp, rating] of Object.entries(option.ratings) as [CompetencyId, number][]) {
      earned[comp] = (earned[comp] ?? 0) + rating;
      possible[comp] = (possible[comp] ?? 0) + MAX_RATING;
      e += rating;
      p += MAX_RATING;
    }
    if (p > 0) decisionScores.push(e / p);
  }

  const competencies: Partial<Record<CompetencyId, number>> = {};
  for (const comp of COMPETENCY_ORDER) {
    if (possible[comp]) competencies[comp] = Math.round(((earned[comp] ?? 0) / possible[comp]!) * 100);
  }

  const overall = decisionScores.length
    ? Math.round((decisionScores.reduce((a, b) => a + b, 0) / decisionScores.length) * 100)
    : 0;

  const ranked = (Object.entries(competencies) as [CompetencyId, number][]).sort((a, b) => b[1] - a[1]);
  const strengths = ranked.filter(([, s]) => s >= 70).slice(0, 3).map(([c]) => c);
  const growthAreas = ranked
    .filter(([, s]) => s < 70)
    .reverse()
    .slice(0, 3)
    .map(([c]) => c);

  return { overall, competencies, strengths, growthAreas, qualityCounts };
}

export interface CompetencyProfile {
  source: 'assessment' | 'practice' | 'none';
  scores: Partial<Record<CompetencyId, number>>;
  overall: number | null;
  attemptsCounted: number;
}

/**
 * Builds the learner's competency profile. Assessment attempts are the summative
 * evidence; practice attempts are used only as a labeled estimate when no
 * assessment exists yet. The most recent attempt per scenario is used.
 */
export function competencyProfile(attempts: SimulationAttempt[]): CompetencyProfile {
  const completed = attempts.filter((a) => a.completedAt && a.competencyScores);
  const assessed = completed.filter((a) => a.mode === 'assessment');
  const pool = assessed.length ? assessed : completed;
  const source: CompetencyProfile['source'] = assessed.length ? 'assessment' : completed.length ? 'practice' : 'none';

  const latestByScenario = new Map<string, SimulationAttempt>();
  for (const a of pool) {
    const prev = latestByScenario.get(a.scenarioId);
    if (!prev || (a.completedAt ?? '') > (prev.completedAt ?? '')) latestByScenario.set(a.scenarioId, a);
  }
  const chosen = [...latestByScenario.values()];

  const sums: Partial<Record<CompetencyId, number[]>> = {};
  for (const a of chosen) {
    for (const [c, s] of Object.entries(a.competencyScores ?? {}) as [CompetencyId, number][]) {
      (sums[c] ??= []).push(s);
    }
  }
  const scores: Partial<Record<CompetencyId, number>> = {};
  for (const c of COMPETENCY_ORDER) {
    const list = sums[c];
    if (list?.length) scores[c] = Math.round(list.reduce((x, y) => x + y, 0) / list.length);
  }
  const overalls = chosen.map((a) => a.overallScore ?? 0);
  return {
    source,
    scores,
    overall: overalls.length ? Math.round(overalls.reduce((x, y) => x + y, 0) / overalls.length) : null,
    attemptsCounted: chosen.length,
  };
}
