/** Base URL of the judge server, which also tells the time (`/api/time`). In dev, Vite proxies /api to it. */
export const JUDGE_URL: string =
  import.meta.env?.VITE_JUDGE_URL ?? (typeof location !== 'undefined' && location.protocol === 'file:' ? 'http://localhost:8787' : '');
