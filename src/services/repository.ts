import type { LearnerProfile, LessonResult, Reflection, SimulationAttempt } from '../types';

/**
 * Persistence boundary. The UI talks only to this interface, so the demo
 * (browser-local) implementation can be swapped for Supabase without UI changes.
 */
export interface LearnerData {
  profile: LearnerProfile;
  attempts: SimulationAttempt[];
  reflections: Reflection[];
  lessons?: LessonResult[];
}

export interface LearnerRepository {
  readonly kind: 'demo' | 'supabase';
  load(): Promise<LearnerData | null>;
  saveProfile(profile: LearnerProfile): Promise<void>;
  saveAttempt(attempt: SimulationAttempt): Promise<void>;
  saveReflection(reflection: Reflection): Promise<void>;
  saveLessonResult(result: LessonResult): Promise<void>;
  deleteReflection(id: string): Promise<void>;
  reset(): Promise<void>;
}

const KEY = 'leadwell.demo.v1';

export class LocalDemoRepository implements LearnerRepository {
  readonly kind = 'demo' as const;

  private read(): LearnerData | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as LearnerData) : null;
    } catch {
      return null;
    }
  }

  private write(data: LearnerData) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable (private mode) — state still lives in memory for the session */
    }
  }

  private update(fn: (d: LearnerData) => LearnerData) {
    const current = this.read();
    if (current) this.write(fn(current));
  }

  async load() {
    return this.read();
  }

  async saveProfile(profile: LearnerProfile) {
    const current = this.read();
    this.write(current ? { ...current, profile } : { profile, attempts: [], reflections: [], lessons: [] });
  }

  async saveAttempt(attempt: SimulationAttempt) {
    this.update((d) => ({ ...d, attempts: [...d.attempts.filter((a) => a.id !== attempt.id), attempt] }));
  }

  async saveReflection(reflection: Reflection) {
    this.update((d) => ({ ...d, reflections: [...d.reflections.filter((r) => r.id !== reflection.id), reflection] }));
  }

  async saveLessonResult(result: LessonResult) {
    this.update((d) => ({ ...d, lessons: [...(d.lessons ?? []).filter((l) => l.moduleId !== result.moduleId), result] }));
  }

  async deleteReflection(id: string) {
    this.update((d) => ({ ...d, reflections: d.reflections.filter((r) => r.id !== id) }));
  }

  async reset() {
    try {
      localStorage.removeItem(KEY);
      Object.keys(localStorage)
        .filter((k) => k.startsWith('leadwell.session.'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}
