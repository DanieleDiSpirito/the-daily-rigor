import { useSyncExternalStore } from 'react';
import type { Language, Verdict } from './judge';

/**
 * Every "Submit" on the Algorithm page is kept, accepted or not. Like progress, this sits
 * behind a small store so it can later move to an API.
 */
export interface Submission {
  id: string;
  problemId: string;
  /** Day number on which the problem was the daily challenge, or 'practice'. */
  ctx: number | 'practice';
  lang: Language;
  code: string;
  verdict: Verdict;
  /** Tests run, tests failed, and the first failing test (1-based). */
  total: number;
  failed: number;
  firstFailed?: number;
  maxTimeMs: number;
  /** Compiler error or runtime message of the first failure, shortened. */
  message?: string;
  at: number;
}

export interface SubmissionStore {
  load(): Submission[];
  save(all: Submission[]): void;
}

const KEY = 'daily-rigor/submissions/v1';
const PER_PROBLEM_LIMIT = 100;

export const localSubmissionStore: SubmissionStore = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Submission[]) : [];
    } catch {
      return [];
    }
  },
  save(all) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable or full: submissions live in memory only */
    }
  },
};

let store: SubmissionStore = localSubmissionStore;
let all: Submission[] = store.load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Another tab may have written submissions: pick them up so we neither show stale data nor overwrite them. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) {
      all = store.load();
      emit();
    }
  });
}

export function setSubmissionStore(s: SubmissionStore) {
  store = s;
  all = s.load();
  emit();
}

export function addSubmission(s: Omit<Submission, 'id' | 'at'>) {
  all = store.load();
  const entry: Submission = { ...s, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() };
  const kept = all.filter((x) => x.problemId === s.problemId).slice(-(PER_PROBLEM_LIMIT - 1));
  all = [...all.filter((x) => x.problemId !== s.problemId), ...kept, entry];
  store.save(all);
  emit();
}

export function clearSubmissions() {
  all = [];
  store.save(all);
  emit();
}

export function useSubmissions(): Submission[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => all,
  );
}

/** Newest first. */
export const submissionsFor = (list: Submission[], problemId: string) => list.filter((s) => s.problemId === problemId).sort((a, b) => b.at - a.at);
