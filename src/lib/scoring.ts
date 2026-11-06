import type { CodingProblem, Difficulty, MathPuzzle, Paper, SectionId } from '../types';
import { dayNumber, pools } from './daily';
import { completedOnDay, everSolved, type ProgressState } from './progress';

/**
 * The scoreboard formula. Every feature is first measured in its own natural unit:
 *
 *   Problem   Σ weight(difficulty) of the puzzles solved   (Introductory 1, Intermediate 2, Advanced 4)
 *   Algorithm Σ Codeforces rating of the problems solved
 *   Paper     Σ reading minutes × quiz correctness (score / total) of the papers completed
 *
 * and then divided by the most it could ever be (the same sum over the whole library), so each feature
 * becomes a fraction between 0 and 1. A feature score is that fraction × 1000, and the overall score is the
 * mean of the three, which makes every feature weigh exactly one third no matter how many items it has or
 * how large its natural unit is. Since the maxima come from the whole library, scores shrink slightly when
 * new items are added.
 */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { Introductory: 1, Intermediate: 2, Advanced: 4 };

const SECTIONS: SectionId[] = ['math', 'code', 'papers'];

export interface FeatureStats {
  /** 0 – 1000: the share of the feature's maximum that has been earned. */
  score: number;
  solved: number;
  /** Length of the most recent run of daily challenges completed on their own day, and the day it ended. */
  streak: number;
  last: number;
  /** Longest run ever. */
  best: number;
}

export interface Stats {
  v: 1;
  /** 0 – 1000: the mean of the three feature scores. */
  score: number;
  /** The day number when these stats were computed. */
  day: number;
  math: FeatureStats;
  code: FeatureStats;
  papers: FeatureStats;
  /** Items solved per category, for each section. */
  cats: Record<SectionId, Record<string, number>>;
}

interface Item {
  id: string;
  /** What the item is worth when completed perfectly, in the feature's own unit. */
  value: number;
  cats: string[];
}

const items = (section: SectionId): Item[] => {
  if (section === 'math') return (pools.math as MathPuzzle[]).map((x) => ({ id: x.id, value: DIFFICULTY_WEIGHT[x.difficulty], cats: x.topic.split(' · ') }));
  if (section === 'code') return (pools.code as CodingProblem[]).map((x) => ({ id: x.id, value: x.rating, cats: x.tags }));
  return (pools.papers as Paper[]).map((x) => ({ id: x.id, value: x.readingMinutes, cats: x.topics }));
};

/** How much of an item's value has been earned, from 0 to 1. For papers it is the quiz correctness. */
function earned(p: ProgressState, section: SectionId, id: string): number {
  if (!everSolved(p, section, id)) return 0;
  if (section !== 'papers') return 1;
  let best = 0;
  for (const [k, a] of Object.entries(p)) {
    if (!k.startsWith(`papers:${id}:`) || !a.solved || !a.total) continue;
    best = Math.max(best, Math.min(1, Math.max(0, (a.score ?? 0) / a.total)));
  }
  return best;
}

/** The most recent run of consecutive completed days up to `today`: its length and its last day. */
export function latestRun(p: ProgressState, section: SectionId, today: number): { len: number; last: number } {
  let d = today;
  while (d >= 0 && !completedOnDay(p, section, d)) d--;
  if (d < 0) return { len: 0, last: -1 };
  const last = d;
  let len = 0;
  while (d >= 0 && completedOnDay(p, section, d)) { len++; d--; }
  return { len, last };
}

/** The longest run of consecutive completed days, ever. */
export function longestStreak(p: ProgressState, section: SectionId, today: number): number {
  let best = 0, run = 0;
  for (let d = 0; d <= today; d++) {
    run = completedOnDay(p, section, d) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** The streak a viewer should see today: a run that ended before yesterday has been broken. */
export const currentStreak = (f: Pick<FeatureStats, 'streak' | 'last'>, today: number) => (f.last >= today - 1 ? f.streak : 0);

const round1 = (x: number) => Math.round(x * 10) / 10;

export function computeStats(p: ProgressState, today: number = dayNumber()): Stats {
  const cats = { math: {}, code: {}, papers: {} } as Stats['cats'];
  const feature = (section: SectionId): FeatureStats => {
    const list = items(section);
    let got = 0, max = 0, solved = 0;
    for (const it of list) {
      max += it.value;
      const e = earned(p, section, it.id);
      got += e * it.value;
      if (everSolved(p, section, it.id)) {
        solved++;
        for (const c of it.cats) cats[section][c] = (cats[section][c] ?? 0) + 1;
      }
    }
    const run = latestRun(p, section, today);
    return { score: max ? round1((1000 * got) / max) : 0, solved, streak: run.len, last: run.last, best: longestStreak(p, section, today) };
  };
  const [math, code, papers] = SECTIONS.map(feature);
  return { v: 1, score: round1((math.score + code.score + papers.score) / 3), day: today, math, code, papers, cats };
}
