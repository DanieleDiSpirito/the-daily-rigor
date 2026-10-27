import { useSyncExternalStore } from 'react';
import type { SectionId } from '../types';
import { dayNumber, dailyId } from './daily';

/**
 * Progress persistence. The app talks only to `ProgressStore`; today it is backed
 * by localStorage, later it can be swapped for an authenticated API client
 * (e.g. GET/PUT /api/me/progress) without touching any component.
 */
export interface Attempt {
  /** Content id (puzzle, problem or paper). */
  id: string;
  section: SectionId;
  /** Day number on which this was the daily challenge, if it was attempted as such. */
  day?: number;
  solved: boolean;
  /** Paper quizzes: correct answers / total. Math: number of wrong guesses. */
  score?: number;
  total?: number;
  attempts: number;
  hintsUsed?: number;
  revealed?: boolean;
  /** Saved code for the coding section (JavaScript). */
  code?: string;
  /** Saved C++ code, and the language last used. */
  codeCpp?: string;
  lang?: 'js' | 'cpp';
  /** Selected options for paper quizzes. */
  answers?: number[];
  updatedAt: number;
}

/** Key = `${section}:${id}:${ctx}` where ctx is a day number (daily attempt) or 'practice'.
 *  Pools are cycled, so the same item can be the daily challenge on several days;
 *  each daily attempt is therefore stored separately. */
export type ProgressState = Record<string, Attempt>;
export type Ctx = number | 'practice';

export interface ProgressStore {
  load(): ProgressState;
  save(state: ProgressState): void;
}

const KEY = 'daily-rigor/progress/v1';

export const localProgressStore: ProgressStore = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ProgressState) : {};
    } catch {
      return {};
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: progress lives in memory only */
    }
  },
};

let store: ProgressStore = localProgressStore;
let state: ProgressState = store.load();
const listeners = new Set<() => void>();

/** Another tab may have written progress: pick that up so we neither show stale data nor overwrite it. */
function refresh() {
  state = store.load();
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) {
      refresh();
      listeners.forEach((l) => l());
    }
  });
}

export function setProgressStore(s: ProgressStore) {
  store = s;
  state = s.load();
  listeners.forEach((l) => l());
}

export const keyOf = (section: SectionId, id: string, ctx: Ctx) => `${section}:${id}:${ctx}`;

export function getAttempt(section: SectionId, id: string, ctx: Ctx): Attempt | undefined {
  return state[keyOf(section, id, ctx)];
}

export function updateAttempt(section: SectionId, id: string, ctx: Ctx, patch: Partial<Attempt>) {
  refresh();
  const k = keyOf(section, id, ctx);
  const prev = state[k] ?? { id, section, day: ctx === 'practice' ? undefined : ctx, solved: false, attempts: 0, updatedAt: 0 };
  state = { ...state, [k]: { ...prev, ...patch, solved: prev.solved || !!patch.solved, updatedAt: Date.now() } };
  store.save(state);
  listeners.forEach((l) => l());
}

export function resetProgress() {
  state = {};
  store.save(state);
  listeners.forEach((l) => l());
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

/** A daily challenge counts as completed if it was solved on its own day. */
export function completedOnDay(p: ProgressState, section: SectionId, day: number): boolean {
  return !!p[keyOf(section, dailyId(section, day), day)]?.solved;
}

/** Whether an item has ever been solved, in any context. */
export function everSolved(p: ProgressState, section: SectionId, id: string): boolean {
  const prefix = `${section}:${id}:`;
  return Object.entries(p).some(([k, a]) => k.startsWith(prefix) && a.solved);
}

export function streak(p: ProgressState, section: SectionId | 'all', today = dayNumber()): number {
  const done = (d: number) =>
    section === 'all'
      ? (['math', 'code', 'papers'] as SectionId[]).every((s) => completedOnDay(p, s, d))
      : completedOnDay(p, section, d);
  // Today's challenge still pending does not break the streak.
  let d = done(today) ? today : today - 1;
  let n = 0;
  while (done(d)) {
    n++;
    d--;
  }
  return n;
}
