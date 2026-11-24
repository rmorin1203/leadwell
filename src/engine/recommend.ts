import { SCENARIOS } from '../data';
import { COMPETENCIES, COMPETENCY_ORDER } from '../data/competencies';
import type { CompetencyId, Scenario, SimulationAttempt } from '../types';
import type { SessionState } from './simulation';
import { competencyProfile } from './scoring';

export interface Recommendation {
  scenario: Scenario;
  reason: string;
  kind: 'new' | 'strengthen' | 'review';
}

const DAY = 86400000;
export const REVIEW_AFTER_DAYS = 7;

export function weakestCompetencies(attempts: SimulationAttempt[], n = 3): CompetencyId[] {
  const p = competencyProfile(attempts);
  return (Object.entries(p.scores) as [CompetencyId, number][])
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([c]) => c);
}

export function recommendScenarios(attempts: SimulationAttempt[]): Recommendation[] {
  const done = attempts.filter((a) => a.completedAt);
  const weak = weakestCompetencies(done);
  const recs: Recommendation[] = [];
  for (const s of SCENARIOS) {
    const mine = done.filter((a) => a.scenarioId === s.id).sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1));
    if (!mine.length) {
      const overlap = s.competencies.filter((c) => weak.includes(c));
      recs.push({
        scenario: s,
        kind: 'new',
        reason: overlap.length
          ? `Builds ${overlap.map((c) => COMPETENCIES[c].label.toLowerCase()).join(' and ')} — current development areas.`
          : s.difficulty === 'beginner'
            ? 'A strong starting point: foundational conversation skills.'
            : `Practice ${COMPETENCIES[s.competencies[0]].label.toLowerCase()} in a ${s.difficulty} scenario.`,
      });
      continue;
    }
    const latest = mine[0];
    const hasAssessment = mine.some((a) => a.mode === 'assessment');
    if ((latest.overallScore ?? 0) < 70) {
      const low = (Object.entries(latest.competencyScores ?? {}) as [CompetencyId, number][]).sort((a, b) => a[1] - b[1])[0];
      recs.push({ scenario: s, kind: 'strengthen', reason: `Latest score ${latest.overallScore}. Replay to strengthen ${low ? COMPETENCIES[low[0]].label.toLowerCase() : 'your approach'}.` });
    } else if (!hasAssessment) {
      recs.push({ scenario: s, kind: 'strengthen', reason: 'Practiced well — take the assessment to record your result.' });
    } else if (Date.now() - new Date(latest.completedAt!).getTime() > REVIEW_AFTER_DAYS * DAY) {
      recs.push({ scenario: s, kind: 'review', reason: `Spaced review: last completed ${Math.floor((Date.now() - new Date(latest.completedAt!).getTime()) / DAY)} days ago.` });
    }
  }
  const order = { new: 0, strengthen: 1, review: 2 };
  return recs.sort((a, b) => order[a.kind] - order[b.kind]);
}

export function reviewDue(attempts: SimulationAttempt[]): { scenario: Scenario; days: number }[] {
  return SCENARIOS.flatMap((s) => {
    const last = attempts.filter((a) => a.scenarioId === s.id && a.completedAt).sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))[0];
    if (!last) return [];
    const days = Math.floor((Date.now() - new Date(last.completedAt!).getTime()) / DAY);
    return days >= REVIEW_AFTER_DAYS ? [{ scenario: s, days }] : [];
  });
}

export function focusCompetency(attempts: SimulationAttempt[]): CompetencyId {
  return weakestCompetencies(attempts, 1)[0] ?? COMPETENCY_ORDER[0];
}

// In-progress session persistence --------------------------------------------
const SESSION_PREFIX = 'leadwell.session.';

export function saveSession(s: SessionState) {
  try {
    localStorage.setItem(SESSION_PREFIX + s.scenarioId, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
export function loadSession(scenarioId: string): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + scenarioId);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}
export function clearSession(scenarioId: string) {
  try {
    localStorage.removeItem(SESSION_PREFIX + scenarioId);
  } catch {
    /* ignore */
  }
}
export function inProgressSessions(): SessionState[] {
  return SCENARIOS.map((s) => loadSession(s.id)).filter((s): s is SessionState => !!s && s.steps.length > 0 && s.currentNodeId !== null);
}
