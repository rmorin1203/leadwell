import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildSampleHistory } from '../data/sampleHistory';
import { uid } from '../engine/attempts';
import { LocalDemoRepository, type LearnerRepository } from '../services/repository';
import type { LearnerProfile, LessonResult, Reflection, SimulationAttempt } from '../types';

interface Toast {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface AppState {
  ready: boolean;
  repoKind: LearnerRepository['kind'];
  profile: LearnerProfile;
  attempts: SimulationAttempt[];
  reflections: Reflection[];
  lessons: LessonResult[];
  saveLessonResult: (r: Omit<LessonResult, 'completedAt'>) => void;
  updateProfile: (p: Partial<LearnerProfile>) => void;
  saveAttempt: (a: SimulationAttempt) => void;
  saveReflection: (r: Omit<Reflection, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => Reflection;
  deleteReflection: (id: string) => void;
  loadSampleHistory: () => void;
  resetDemo: () => void;
  toasts: Toast[];
  notify: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const defaultProfile = (): LearnerProfile => ({
  id: 'demo-learner',
  name: 'Alex Rivera',
  role: 'Team Lead (newly promoted)',
  createdAt: new Date().toISOString(),
});

export function AppProvider({ children, repository = new LocalDemoRepository() }: { children: ReactNode; repository?: LearnerRepository }) {
  const repo = useRef(repository).current;
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<LearnerProfile>(defaultProfile);
  const [attempts, setAttempts] = useState<SimulationAttempt[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [lessons, setLessons] = useState<LessonResult[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = uid();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const guard = useCallback(
    (p: Promise<unknown>) => p.catch(() => notify('We could not save that change. Your work is kept for this session.', 'error')),
    [notify],
  );

  useEffect(() => {
    repo.load().then((data) => {
      if (data) {
        setProfile(data.profile);
        setAttempts(data.attempts);
        setReflections(data.reflections);
        setLessons(data.lessons ?? []);
      } else {
        void repo.saveProfile(defaultProfile());
      }
      setReady(true);
    });
  }, [repo]);

  const saveLessonResult = useCallback(
    (r: Omit<LessonResult, 'completedAt'>) => {
      const result: LessonResult = { ...r, completedAt: new Date().toISOString() };
      setLessons((prev) => [...prev.filter((l) => l.moduleId !== r.moduleId), result]);
      void guard(repo.saveLessonResult(result));
    },
    [repo, guard],
  );

  const updateProfile = useCallback(
    (p: Partial<LearnerProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...p };
        void guard(repo.saveProfile(next));
        return next;
      });
    },
    [repo, guard],
  );

  const saveAttempt = useCallback(
    (a: SimulationAttempt) => {
      setAttempts((prev) => [...prev.filter((x) => x.id !== a.id), a]);
      void guard(repo.saveAttempt(a));
    },
    [repo, guard],
  );

  const reflectionsRef = useRef(reflections);
  reflectionsRef.current = reflections;

  const saveReflection: AppState['saveReflection'] = useCallback(
    (input) => {
      const now = new Date().toISOString();
      const existing = input.id ? reflectionsRef.current.find((r) => r.id === input.id) : undefined;
      const saved: Reflection = existing
        ? { ...existing, ...input, id: existing.id, updatedAt: now }
        : { ...input, id: uid(), userId: profile.id, createdAt: now, updatedAt: now };
      setReflections((prev) => [...prev.filter((r) => r.id !== saved.id), saved]);
      void guard(repo.saveReflection(saved));
      return saved;
    },
    [repo, guard, profile.id],
  );

  const deleteReflection = useCallback(
    (id: string) => {
      setReflections((prev) => prev.filter((r) => r.id !== id));
      void guard(repo.deleteReflection(id));
    },
    [repo, guard],
  );

  const loadSampleHistory = useCallback(() => {
    const sample = buildSampleHistory(profile.id);
    sample.attempts.forEach((a) => void repo.saveAttempt(a));
    sample.reflections.forEach((r) => void repo.saveReflection(r));
    sample.lessons.forEach((l) => void repo.saveLessonResult(l));
    setAttempts((prev) => [...prev, ...sample.attempts]);
    setReflections((prev) => [...prev, ...sample.reflections]);
    setLessons((prev) => [...prev.filter((l) => !sample.lessons.some((x) => x.moduleId === l.moduleId)), ...sample.lessons]);
    notify('Fictional sample progress loaded: 2 lessons, 3 simulation runs, and 2 journal entries.', 'info');
  }, [repo, profile.id, notify]);

  const resetDemo = useCallback(() => {
    void repo.reset().then(() => repo.saveProfile(defaultProfile()));
    setProfile(defaultProfile());
    setAttempts([]);
    setReflections([]);
    setLessons([]);
    notify('Course progress reset. You are starting fresh.', 'info');
  }, [repo, notify]);

  const value = useMemo<AppState>(
    () => ({
      ready, repoKind: repo.kind, profile, attempts, reflections, lessons, saveLessonResult, updateProfile, saveAttempt,
      saveReflection, deleteReflection, loadSampleHistory, resetDemo, toasts, notify, dismissToast,
    }),
    [ready, repo.kind, profile, attempts, reflections, lessons, saveLessonResult, updateProfile, saveAttempt, saveReflection, deleteReflection, loadSampleHistory, resetDemo, toasts, notify, dismissToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
