import { JUDGE_URL } from './endpoint';

/**
 * The day is decided by the server, not by the device: the server tells us what time it is and in which
 * time zone the day changes, and from then on we count with the browser's monotonic timer, which does not
 * move when the user changes the system clock. If the server cannot be reached (offline, or a static
 * host without the judge) we fall back to the device's clock and time zone, still frozen at page load.
 */
let zone: string | undefined; // undefined = the device's own time zone
let anchor = { server: Date.now(), perf: performance.now() };

/** The current time, as far as the server is concerned. */
export const clockNow = () => new Date(anchor.server + (performance.now() - anchor.perf));

export function zonedParts(d: Date, timeZone: string | undefined = zone) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(d)) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Asks the server for the time. Returns false (and keeps the previous clock) if it cannot be reached. */
export async function syncClock(timeoutMs = 2500): Promise<boolean> {
  try {
    const t0 = performance.now();
    const res = await fetch(`${JUDGE_URL}/api/time`, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return false;
    const body = (await res.json()) as { now?: unknown; tz?: unknown };
    const t1 = performance.now();
    if (typeof body.now !== 'number' || !Number.isFinite(body.now)) return false;
    anchor = { server: body.now + (t1 - t0) / 2, perf: t1 }; // the server stamped it about half a round trip ago
    if (typeof body.tz === 'string') {
      try { new Intl.DateTimeFormat('en', { timeZone: body.tz }); zone = body.tz; } catch { /* unknown zone: keep the device's */ }
    }
    return true;
  } catch {
    return false;
  }
}

/** Keeps the clock in step with the server (the monotonic timer can drift, or pause while the computer sleeps). */
export function startClock() {
  setInterval(() => void syncClock(), 10 * 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void syncClock(); });
}
