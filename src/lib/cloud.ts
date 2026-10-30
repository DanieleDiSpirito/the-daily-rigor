import type { SupabaseClient } from '@supabase/supabase-js';
import { setProgressStore, type ProgressState } from './progress';
import { setSubmissionStore, type Submission } from './submissions';

/**
 * Per-user storage: the browser keeps a cache (so the UI stays synchronous and works offline),
 * and the whole state is pushed to one row of `user_data`, merged with what the server has.
 * Row-level security guarantees that a user can only read and write their own row.
 */
const cacheKey = (what: 'progress' | 'submissions', uid: string) => `daily-rigor/${what}/v1:${uid}`;
const LEGACY = { progress: 'daily-rigor/progress/v1', submissions: 'daily-rigor/submissions/v1' };

const read = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or unavailable: the server copy still has it */
  }
};

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const out: ProgressState = { ...a };
  for (const [k, v] of Object.entries(b)) if (!out[k] || (v.updatedAt ?? 0) > (out[k].updatedAt ?? 0)) out[k] = v;
  return out;
}

export function mergeSubmissions(a: Submission[], b: Submission[]): Submission[] {
  const byId = new Map<string, Submission>();
  for (const s of [...a, ...b]) byId.set(s.id, s);
  return [...byId.values()].sort((x, y) => x.at - y.at);
}

export async function attachCloud(client: SupabaseClient, uid: string) {
  const pKey = cacheKey('progress', uid), sKey = cacheKey('submissions', uid);
  let progress = read<ProgressState>(pKey, {});
  let subs = read<Submission[]>(sKey, []);

  const remote = await client.from('user_data').select('progress, submissions').eq('user_id', uid).maybeSingle();
  if (remote.data) {
    progress = mergeProgress(progress, remote.data.progress as ProgressState);
    subs = mergeSubmissions(subs, remote.data.submissions as Submission[]);
  }
  // Progress saved in this browser before signing in (as a guest) is deliberately discarded, never uploaded:
  // it could have been edited by hand, and signing in starts from a clean slate. The sign-in page says so.
  try { localStorage.removeItem(LEGACY.progress); localStorage.removeItem(LEGACY.submissions); } catch { /* ignore */ }
  write(pKey, progress);
  write(sKey, subs);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let inflight = Promise.resolve();
  const push = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      inflight = inflight.then(async () => {
        // Merge with the server first, so another device's progress is not overwritten.
        const cur = await client.from('user_data').select('progress, submissions').eq('user_id', uid).maybeSingle();
        const p = mergeProgress(read<ProgressState>(pKey, {}), (cur.data?.progress as ProgressState) ?? {});
        const s = mergeSubmissions(read<Submission[]>(sKey, []), (cur.data?.submissions as Submission[]) ?? []);
        write(pKey, p);
        write(sKey, s);
        await client.from('user_data').upsert({ user_id: uid, progress: p, submissions: s, updated_at: new Date().toISOString() });
      }).catch(() => {});
    }, 800);
  };

  setProgressStore({
    load: () => read<ProgressState>(pKey, {}),
    save: (state) => { write(pKey, state); push(); },
  });
  setSubmissionStore({
    load: () => read<Submission[]>(sKey, []),
    save: (all) => { write(sKey, all); push(); },
  });
  push(); // upload the merged result once
}
