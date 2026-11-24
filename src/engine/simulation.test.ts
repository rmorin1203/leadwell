import { describe, expect, it } from 'vitest';
import { PERSONAS, SCENARIOS, getScenario } from '../data';
import { choose, createSession, isComplete, rewind } from './simulation';
import { competencyProfile, scorePath } from './scoring';
import type { Scenario } from '../types';

function play(s: Scenario, pick: (i: number) => number, mode: 'practice' | 'assessment' = 'assessment') {
  let st = createSession(s, PERSONAS, mode);
  let i = 0;
  while (st.currentNodeId) {
    const node = s.nodes[st.currentNodeId];
    st = choose(st, s, PERSONAS, node.options[pick(i++) % node.options.length].id);
  }
  return st;
}

describe('simulation engine', () => {
  it('every scenario can be completed on every path', () => {
    for (const s of SCENARIOS) {
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
        const st = play(s, (i) => [a, b, c][i] ?? 0);
        expect(isComplete(st)).toBe(true);
        expect(s.outcomes[st.outcomeId!]).toBeDefined();
      }
    }
  });

  it('different openings produce different employee responses and nodes', () => {
    for (const s of SCENARIOS) {
      const start = s.nodes[s.startNodeId];
      const reactions = new Set(start.options.map((o) => o.reaction[0].text));
      const nexts = new Set(start.options.map((o) => o.next));
      expect(reactions.size).toBe(3);
      expect(nexts.size).toBe(3);
    }
  });

  it('strongest path scores higher than weakest path and reaches a better outcome', () => {
    const tiers = { breakthrough: 4, productive: 3, partial: 2, strained: 1 };
    for (const s of SCENARIOS) {
      const pickQuality = (q: string) => {
        let st = createSession(s, PERSONAS, 'assessment');
        while (st.currentNodeId) {
          const node = s.nodes[st.currentNodeId];
          const opt = node.options.find((o) => o.quality === q) ?? node.options[0];
          st = choose(st, s, PERSONAS, opt.id);
        }
        return st;
      };
      const good = pickQuality('effective');
      const weak = pickQuality('limited');
      const gs = scorePath(s, good.steps);
      const ws = scorePath(s, weak.steps);
      expect(gs.overall).toBeGreaterThan(ws.overall);
      expect(tiers[s.outcomes[good.outcomeId!].tier]).toBeGreaterThan(tiers[s.outcomes[weak.outcomeId!].tier]);
      expect(good.outcomeId).toBe('breakthrough');
    }
  });

  it('rewind restores trust and counts retries in practice mode only', () => {
    const s = getScenario('declining-performance')!;
    let st = createSession(s, PERSONAS, 'practice');
    const before = st.trust;
    st = choose(st, s, PERSONAS, 'open-expectations');
    expect(st.trust.maya).toBeLessThan(before.maya);
    st = rewind(st);
    expect(st.trust).toEqual(before);
    expect(st.retries.open).toBe(1);
    let as = createSession(s, PERSONAS, 'assessment');
    as = choose(as, s, PERSONAS, 'open-expectations');
    expect(rewind(as).steps.length).toBe(1);
  });

  it('competency profile prefers assessment evidence', () => {
    const p = competencyProfile([
      { id: '1', userId: 'u', scenarioId: 'a', mode: 'practice', startedAt: '1', completedAt: '2', decisions: [], overallScore: 40, competencyScores: { empathy: 40 } },
      { id: '2', userId: 'u', scenarioId: 'a', mode: 'assessment', startedAt: '3', completedAt: '4', decisions: [], overallScore: 80, competencyScores: { empathy: 80 } },
    ]);
    expect(p.source).toBe('assessment');
    expect(p.scores.empathy).toBe(80);
  });
});
