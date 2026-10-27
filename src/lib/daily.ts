import type { SectionId } from '../types';
import { mathPuzzles } from '../content/math';
import { codingProblems } from '../content/code';
import { papers } from '../content/papers';

/** Day 0 of the platform (26 October 2026). Day numbers are counted in the user's local calendar. */
const EPOCH = Date.UTC(2026, 9, 26);

export function dayNumber(d = new Date()): number {
  const localMidnightAsUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((localMidnightAsUtc - EPOCH) / 86_400_000);
}

export function dateOfDay(day: number): Date {
  const u = new Date(EPOCH + day * 86_400_000);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
}

export function formatDay(day: number, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  return dateOfDay(day).toLocaleDateString('en-GB', opts);
}

export const pools = {
  math: mathPuzzles,
  code: codingProblems,
  papers,
} as const;

/** Day d shows the d-th item of each pool, so nothing repeats until a pool is exhausted
 *  (21 items cover 26 Oct – 15 Nov 2026); after that the pool cycles. Days before the
 *  launch show the first item. When a backend exists, replace this with a server-side schedule. */
export function dailyIndex(section: SectionId, day: number): number {
  return Math.max(day, 0) % pools[section].length;
}

/** Whether an item has been the daily challenge on or before `today` (future ones stay hidden). */
export function isReleased(section: SectionId, id: string, today: number): boolean {
  const n = pools[section].length;
  const idx = pools[section].findIndex((x) => x.id === id);
  return idx >= 0 && (today >= n - 1 || idx <= Math.max(today, 0));
}

export function dailyId(section: SectionId, day: number): string {
  return pools[section][dailyIndex(section, day)].id;
}

export function msUntilTomorrow(now = new Date()): number {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return t.getTime() - now.getTime();
}

export const SECTION_META: Record<SectionId, { label: string; numeral: string; blurb: string }> = {
  math: { label: 'Problem', numeral: 'I', blurb: 'A puzzle in probability, combinatorics or number representation, with a single verifiable answer.' },
  code: { label: 'Algorithm', numeral: 'II', blurb: 'A competitive-programming task judged against hidden tests in your browser.' },
  papers: { label: 'Paper', numeral: 'III', blurb: 'A landmark, readable paper, with a structured summary and a comprehension quiz.' },
};
