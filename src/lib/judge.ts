import type { CodingProblem } from '../types';
import { tokens } from './rng';
import { accessToken } from './auth';

/**
 * In-browser judge. User code runs in a dedicated Web Worker so that infinite
 * loops can be killed. For a public deployment, replace this with a server-side
 * sandbox (and move hidden tests and reference solutions off the client).
 */

export type Verdict = 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';
export type Language = 'js' | 'cpp';

/** Base URL of the C++ judge server (`npm run judge`). In dev, Vite proxies /api to it. */
const JUDGE_URL: string =
  import.meta.env?.VITE_JUDGE_URL ?? (typeof location !== 'undefined' && location.protocol === 'file:' ? 'http://localhost:8787' : '');

export interface TestResult {
  index: number;
  verdict: Verdict;
  timeMs: number;
  message?: string;
  inputPreview?: string;
  outputPreview?: string;
  expectedPreview?: string;
  /** Complete texts, kept only for failing tests so they can be copied or expanded. */
  fullInput?: string;
  fullOutput?: string;
  fullExpected?: string;
}

export interface JudgeReport {
  verdict: Verdict;
  results: TestResult[];
  /** Index of the first failing test, if any. */
  failedAt?: number;
  /** Every test is run even after a failure, so this counts how many failed. */
  failedCount: number;
  maxTimeMs: number;
}

const WORKER_SRC = `
let solve = null;
self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'compile') {
    try {
      const f = new Function(m.code + '\\n;return typeof solve === "function" ? solve : null;');
      solve = f();
      if (!solve) throw new Error('No function named solve(input) was defined.');
      self.postMessage({ type: 'compiled' });
    } catch (err) {
      self.postMessage({ type: 'error', phase: 'compile', message: String(err && err.message || err) });
    }
    return;
  }
  if (m.type === 'run') {
    const t0 = performance.now();
    try {
      let out = solve(m.input);
      if (Array.isArray(out)) out = out.join('\\n');
      const t1 = performance.now();
      self.postMessage({ type: 'result', output: out == null ? '' : String(out), timeMs: t1 - t0 });
    } catch (err) {
      self.postMessage({ type: 'error', phase: 'run', message: String(err && err.stack || err), timeMs: performance.now() - t0 });
    }
  }
};`;

let workerUrl: string | null = null;
let workersUnavailable = false;

/** Same-thread fallback for environments that forbid blob workers (cannot stop infinite loops). */
class InlineRunner {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  private scope: { onmessage?: (e: { data: unknown }) => void } = {};
  constructor() {
    const self = { postMessage: (data: unknown) => setTimeout(() => this.onmessage?.({ data }), 0), onmessage: undefined as unknown };
    new Function('self', WORKER_SRC)(self);
    this.scope = self as typeof this.scope;
  }
  postMessage(data: unknown) {
    setTimeout(() => this.scope.onmessage?.({ data }), 0);
  }
  terminate() {}
}

function makeWorker(): Worker {
  if (!workersUnavailable) {
    try {
      workerUrl ??= URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
      return new Worker(workerUrl);
    } catch {
      workersUnavailable = true;
    }
  }
  return new InlineRunner() as unknown as Worker;
}

export const usingInlineRunner = () => workersUnavailable;

/** Judging goes on after a failed test (so all failing tests are shown), but stops after this many time-outs. */
const MAX_TLE = 2;

const preview = (s: string, n = 400) => (s.length > n ? s.slice(0, n) + `\n… (${s.length - n} more characters)` : s);

function defaultCheck(_input: string, output: string, expected: string): string | null {
  const a = tokens(output), b = tokens(expected);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      if (a[i] === undefined) return `Output ended early: expected ${b.length} tokens, found ${a.length}.`;
      if (b[i] === undefined) return `Too many tokens: expected ${b.length}, found ${a.length}.`;
      return `Token ${i + 1} differs: expected "${b[i].slice(0, 40)}", found "${a[i].slice(0, 40)}".`;
    }
  }
  return null;
}

type Msg = { type: 'compiled' } | { type: 'result'; output: string; timeMs: number } | { type: 'error'; phase: string; message: string; timeMs?: number };

function request(w: Worker, msg: unknown, timeoutMs: number): Promise<Msg | 'timeout'> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve('timeout'), timeoutMs);
    w.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data as Msg);
    };
    w.onerror = (e) => {
      clearTimeout(timer);
      e.preventDefault();
      resolve({ type: 'error', phase: 'worker', message: e.message || 'Worker failed to start.' });
    };
    w.postMessage(msg);
  });
}

function summarize(results: TestResult[], maxTimeMs: number): JudgeReport {
  const failed = results.filter((r) => r.verdict !== 'AC');
  return { verdict: failed[0]?.verdict ?? 'AC', results, failedAt: failed[0]?.index, failedCount: failed.length, maxTimeMs };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await accessToken();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${JUDGE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (res.status === 401 || res.status === 403) throw new Error('Not signed in, or not invited. Sign in again.');
  if (res.status === 429) throw new Error('Too many submissions. Wait a moment and try again.');
  if (!res.ok) throw new Error(`Judge server answered ${res.status}.`);
  return (await res.json()) as T;
}

const SERVER_DOWN = 'Cannot reach the C++ judge server. Start it with `npm run judge` (or run everything with `npm run docker`) and try again.';

/** A network failure means the server is unreachable; anything else is a message worth showing as is. */
const failureMessage = (e: unknown) => (e instanceof TypeError ? SERVER_DOWN : (e as Error).message);

/** Compiles and runs C++ on the local judge server; verdicts follow the same rules as the JavaScript judge. */
async function judgeCpp(
  problem: CodingProblem,
  code: string,
  mode: 'samples' | 'full',
  onProgress?: (done: number, total: number) => void,
): Promise<JudgeReport> {
  const inputs = mode === 'samples' ? problem.samples.map((s) => s.input) : problem.generateTests().map((t) => t.input);
  const check = problem.check ?? defaultCheck;
  const ce = (message: string): JudgeReport => ({ verdict: 'CE', results: [{ index: 0, verdict: 'CE', timeMs: 0, message }], failedAt: 0, failedCount: 1, maxTimeMs: 0 });

  let id: string;
  try {
    const c = await post<{ id?: string; error?: string }>('/api/compile', { code });
    if (!c.id) return ce(c.error ?? 'Compilation failed.');
    id = c.id;
  } catch (e) {
    return ce(failureMessage(e));
  }

  const results: TestResult[] = [];
  let maxTimeMs = 0, tles = 0;
  for (let i = 0; i < inputs.length; i++) {
    onProgress?.(i, inputs.length);
    const input = inputs[i];
    const base = { index: i, inputPreview: preview(input) };
    let r: { status: 'ok' | 'tle' | 're'; stdout: string; timeMs: number; message?: string };
    try {
      r = await post('/api/run', { id, input, timeLimitMs: problem.timeLimitMs });
    } catch (e) {
      results.push({ ...base, verdict: 'RE', timeMs: 0, message: failureMessage(e), fullInput: input });
      break;
    }
    maxTimeMs = Math.max(maxTimeMs, r.timeMs);
    if (r.status === 'tle') {
      results.push({ ...base, verdict: 'TLE', timeMs: r.timeMs, message: r.message, fullInput: input });
      if (++tles >= MAX_TLE) break;
      continue;
    }
    if (r.status === 're') { results.push({ ...base, verdict: 'RE', timeMs: r.timeMs, message: r.message, fullInput: input, fullOutput: r.stdout }); continue; }
    const expected = mode === 'samples' ? problem.samples[i].output : problem.reference(input);
    const reason = check(input, r.stdout, expected);
    results.push({
      ...base, verdict: reason ? 'WA' : 'AC', timeMs: r.timeMs, message: reason ?? undefined, outputPreview: preview(r.stdout), expectedPreview: preview(expected),
      ...(reason ? { fullInput: input, fullOutput: r.stdout, fullExpected: expected } : {}),
    });
  }
  onProgress?.(inputs.length, inputs.length);
  return summarize(results, maxTimeMs);
}

export async function judge(
  problem: CodingProblem,
  code: string,
  mode: 'samples' | 'full',
  onProgress?: (done: number, total: number) => void,
  language: Language = 'js',
): Promise<JudgeReport> {
  if (language === 'cpp') return judgeCpp(problem, code, mode, onProgress);
  const inputs = mode === 'samples' ? problem.samples.map((s) => s.input) : problem.generateTests().map((t) => t.input);
  const check = problem.check ?? defaultCheck;
  const results: TestResult[] = [];
  let worker = makeWorker();
  let maxTimeMs = 0;

  let compiled = await request(worker, { type: 'compile', code }, 3000);
  if (compiled !== 'timeout' && compiled.type === 'error' && compiled.phase === 'worker') {
    worker.terminate();
    workersUnavailable = true;
    worker = makeWorker();
    compiled = await request(worker, { type: 'compile', code }, 3000);
  }
  if (compiled === 'timeout' || compiled.type === 'error') {
    worker.terminate();
    const message = compiled === 'timeout' ? 'Top-level code did not finish.' : compiled.message;
    return { verdict: 'CE', results: [{ index: 0, verdict: 'CE', timeMs: 0, message }], failedAt: 0, failedCount: 1, maxTimeMs: 0 };
  }

  let tles = 0;
  try {
    for (let i = 0; i < inputs.length; i++) {
      onProgress?.(i, inputs.length);
      const input = inputs[i];
      // A generous wall-clock watchdog; the verdict uses the measured CPU-side time.
      const res = await request(worker, { type: 'run', input }, problem.timeLimitMs * 2 + 500);
      const base = { index: i, inputPreview: preview(input) };
      if (res === 'timeout') {
        results.push({ ...base, verdict: 'TLE', timeMs: problem.timeLimitMs * 2, message: `Exceeded the time limit of ${problem.timeLimitMs} ms.`, fullInput: input });
        if (++tles >= MAX_TLE) break;
        // The runaway worker is killed; start a fresh one with the same code.
        worker.terminate();
        worker = makeWorker();
        await request(worker, { type: 'compile', code }, 3000);
        continue;
      }
      if (res.type === 'error') {
        results.push({ ...base, verdict: 'RE', timeMs: res.timeMs ?? 0, message: res.message, fullInput: input });
        continue;
      }
      if (res.type !== 'result') continue;
      maxTimeMs = Math.max(maxTimeMs, res.timeMs);
      if (res.timeMs > problem.timeLimitMs) {
        results.push({ ...base, verdict: 'TLE', timeMs: res.timeMs, message: `Took ${Math.round(res.timeMs)} ms; the limit is ${problem.timeLimitMs} ms.`, fullInput: input });
        if (++tles >= MAX_TLE) break;
        continue;
      }
      const expected = mode === 'samples' ? problem.samples[i].output : problem.reference(input);
      const reason = check(input, res.output, expected);
      results.push({
        ...base,
        verdict: reason ? 'WA' : 'AC',
        timeMs: res.timeMs,
        message: reason ?? undefined,
        outputPreview: preview(res.output),
        expectedPreview: preview(expected),
        ...(reason ? { fullInput: input, fullOutput: res.output, fullExpected: expected } : {}),
      });
    }
  } finally {
    worker.terminate();
  }
  onProgress?.(inputs.length, inputs.length);
  return summarize(results, maxTimeMs);
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  AC: 'Accepted',
  WA: 'Wrong answer',
  TLE: 'Time limit exceeded',
  RE: 'Runtime error',
  CE: 'Compilation error',
};

export const STARTER_CODE = `/**
 * Read the entire standard input as a string and return the entire output.
 * You may return a string or an array of lines.
 */
function solve(input) {
  const data = input.split(/\\s+/).filter(Boolean);
  let pos = 0;
  const next = () => data[pos++];
  const nextInt = () => Number(data[pos++]);

  const out = [];
  // Your solution here.

  return out.join('\\n');
}
`;

export const STARTER_CODE_CPP = `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  // Read from cin, write to cout.
  return 0;
}
`;
