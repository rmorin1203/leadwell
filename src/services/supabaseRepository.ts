import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LearnerProfile, LessonResult, Reflection, SimulationAttempt } from '../types';
import type { LearnerData, LearnerRepository } from './repository';

/**
 * Supabase-backed repository. Enabled only when VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set. Row Level Security (supabase/schema.sql)
 * guarantees learners can only read their own attempts and reflections, and
 * administrators can read aggregate views that exclude reflection text.
 */
export class SupabaseRepository implements LearnerRepository {
  readonly kind = 'supabase' as const;
  constructor(private client: SupabaseClient, private userId: string) {}

  async load(): Promise<LearnerData | null> {
    const [profile, attempts, reflections, lessons] = await Promise.all([
      this.client.from('profiles').select('*').eq('id', this.userId).maybeSingle(),
      this.client.from('simulation_attempts').select('*').eq('user_id', this.userId),
      this.client.from('reflections').select('*').eq('user_id', this.userId),
      this.client.from('lesson_results').select('*').eq('user_id', this.userId),
    ]);
    if (profile.error) throw profile.error;
    if (!profile.data) return null;
    return {
      profile: { id: profile.data.id, name: profile.data.display_name, role: profile.data.job_title ?? '', createdAt: profile.data.created_at },
      attempts: (attempts.data ?? []).map((a) => ({
        id: a.id, userId: a.user_id, scenarioId: a.scenario_id, mode: a.mode, startedAt: a.started_at,
        completedAt: a.completed_at ?? undefined, decisions: a.decisions, outcomeId: a.outcome_id ?? undefined,
        overallScore: a.overall_score ?? undefined, competencyScores: a.competency_scores ?? undefined, finalTrust: a.final_trust ?? undefined,
      })),
      reflections: (reflections.data ?? []).map((r) => ({
        id: r.id, userId: r.user_id, createdAt: r.created_at, updatedAt: r.updated_at, scenarioId: r.scenario_id ?? undefined,
        attemptId: r.attempt_id ?? undefined, prompt: r.prompt, text: r.body, commitment: r.commitment ?? undefined,
      })),
      lessons: (lessons.data ?? []).map((l) => ({ moduleId: l.module_id, completedAt: l.completed_at, correct: l.correct, total: l.total })),
    };
  }

  async saveProfile(p: LearnerProfile) {
    const { error } = await this.client.from('profiles').upsert({ id: this.userId, display_name: p.name, job_title: p.role });
    if (error) throw error;
  }

  async saveAttempt(a: SimulationAttempt) {
    const { error } = await this.client.from('simulation_attempts').upsert({
      id: a.id, user_id: this.userId, scenario_id: a.scenarioId, mode: a.mode, started_at: a.startedAt,
      completed_at: a.completedAt ?? null, decisions: a.decisions, outcome_id: a.outcomeId ?? null,
      overall_score: a.overallScore ?? null, competency_scores: a.competencyScores ?? null, final_trust: a.finalTrust ?? null,
    });
    if (error) throw error;
  }

  async saveReflection(r: Reflection) {
    const { error } = await this.client.from('reflections').upsert({
      id: r.id, user_id: this.userId, scenario_id: r.scenarioId ?? null, attempt_id: r.attemptId ?? null,
      prompt: r.prompt, body: r.text, commitment: r.commitment ?? null, updated_at: r.updatedAt,
    });
    if (error) throw error;
  }

  async saveLessonResult(l: LessonResult) {
    const { error } = await this.client.from('lesson_results').upsert({ user_id: this.userId, module_id: l.moduleId, completed_at: l.completedAt, correct: l.correct, total: l.total });
    if (error) throw error;
  }

  async deleteReflection(id: string) {
    const { error } = await this.client.from('reflections').delete().eq('id', id);
    if (error) throw error;
  }

  async reset() {
    await this.client.from('reflections').delete().eq('user_id', this.userId);
    await this.client.from('simulation_attempts').delete().eq('user_id', this.userId);
    await this.client.from('lesson_results').delete().eq('user_id', this.userId);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && key ? createClient(url, key) : null;
}
