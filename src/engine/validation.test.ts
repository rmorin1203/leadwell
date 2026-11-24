import { describe, expect, it } from 'vitest';
import { PERSONAS, SCENARIOS } from '../data';
import { validateScenario } from './validation';

describe('scenario content validation', () => {
  for (const s of SCENARIOS) {
    it(`${s.id} has a valid branching graph and complete feedback`, () => {
      const report = validateScenario(s, PERSONAS);
      const errors = report.issues.filter((i) => i.level === 'error');
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
      expect(report.minDecisionsPerPath).toBeGreaterThanOrEqual(3);
      expect(report.issues.filter((i) => i.level === 'warning'), JSON.stringify(report.issues)).toEqual([]);
    });
  }
  it('has six persona archetypes', () => {
    expect(new Set(PERSONAS.map((p) => p.archetype)).size).toBe(6);
  });
});
