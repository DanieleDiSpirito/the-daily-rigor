/** Reinforcement-learning week: seven special days (31 Oct – 6 Nov 2026) are slotted in right after
 *  the first five items (26–30 Oct, already published). The regular programme then resumes on
 *  Saturday 7 Nov exactly where it left off, so nothing is dropped, only shifted by seven days. */
export const RL_INSERT_AT = 5;

export function withRlWeek<T>(base: T[], rl: T[]): T[] {
  return [...base.slice(0, RL_INSERT_AT), ...rl, ...base.slice(RL_INSERT_AT)];
}
