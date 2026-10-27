// Minimal C++ judge for The Daily Rigor. No dependencies.
//   POST /api/compile {code}                       -> {id} | {error}
//   POST /api/run     {id, input, timeLimitMs}     -> {status: 'ok'|'tle'|'re', stdout, timeMs, message?}
//   GET  /api/health                               -> {ok, compiler}
// With STATIC_DIR set (as in the Docker image) it also serves the built web app.
// With SUPABASE_URL and SUPABASE_ANON_KEY set, /api/compile and /api/run require a Supabase session
// of an invited user (see supabase/schema.sql) and are rate limited per user.
// Run it with `npm run judge` (needs g++) or everything at once with `npm run docker`.
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, normalize, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const MAX_BODY = 16 * 1024 * 1024;
const MAX_OUTPUT = 32 * 1024 * 1024;
const TTL_MS = 10 * 60 * 1000;
const STATIC_DIR = process.env.STATIC_DIR;
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const AUTH = !!(SUPABASE_URL && SUPABASE_KEY);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // e.g. https://rigor.example.com; unset = same-origin only when AUTH is on
const MEMORY_KB = Number(process.env.MEMORY_LIMIT_KB ?? 512 * 1024);
const MAX_PARALLEL = Number(process.env.MAX_PARALLEL ?? 4);
const LIMITS = { compile: { n: 12, perMs: 60_000 }, run: { n: 120, perMs: 60_000 } };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const PCH_DIR = '/opt/pch'; // precompiled <bits/stdc++.h>, built into the Docker image
const FLAGS = ['-O2', '-std=c++20', '-pipe', ...(existsSync(PCH_DIR) ? [`-I${PCH_DIR}`] : [])];

/** First C++ compiler that can build a program using <bits/stdc++.h> (Apple's clang cannot). */
function findCompiler() {
  const dir = mkdtempSync(join(tmpdir(), 'rigor-probe-'));
  writeFileSync(join(dir, 'p.cpp'), '#include <bits/stdc++.h>\nint main(){}\n');
  const candidates = [process.env.CXX, 'g++-16', 'g++-15', 'g++-14', 'g++-13', 'g++'].filter(Boolean);
  try {
    for (const cxx of candidates) {
      const r = spawnSync(cxx, [...FLAGS, join(dir, 'p.cpp'), '-o', join(dir, 'p')], { encoding: 'utf8' });
      if (r.status === 0) return cxx;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return null;
}

const CXX = findCompiler();
if (!CXX) {
  console.error('No usable g++ found (one that supports <bits/stdc++.h>). Install GCC or set CXX=/path/to/g++.');
  process.exit(1);
}

/** id -> {dir, bin, timer} */
const programs = new Map();
const dispose = (id) => {
  const p = programs.get(id);
  if (!p) return;
  clearTimeout(p.timer);
  rmSync(p.dir, { recursive: true, force: true });
  programs.delete(id);
};

function compile(code) {
  const dir = mkdtempSync(join(tmpdir(), 'rigor-'));
  writeFileSync(join(dir, 'main.cpp'), code);
  return new Promise((resolve) => {
    const child = spawn(CXX, [...FLAGS, 'main.cpp', '-o', 'main'], { cwd: dir });
    let err = '';
    child.stderr.on('data', (d) => { if (err.length < 20000) err += d; });
    const kill = setTimeout(() => child.kill('SIGKILL'), 30_000);
    child.on('close', (status) => {
      clearTimeout(kill);
      if (status !== 0 || !existsSync(join(dir, 'main'))) {
        rmSync(dir, { recursive: true, force: true });
        return resolve({ error: err.trim() || 'Compilation failed.' });
      }
      const id = randomUUID();
      programs.set(id, { dir, bin: join(dir, 'main'), timer: setTimeout(() => dispose(id), TTL_MS) });
      // The first launch of a fresh binary can be slow (e.g. macOS scanning it); warm it up so timings are fair.
      run(id, '', 5000).then(() => resolve({ id }));
    });
  });
}

function run(id, input, timeLimitMs) {
  const prog = programs.get(id);
  if (!prog) return Promise.resolve({ status: 're', stdout: '', timeMs: 0, message: 'Program expired; submit again.' });
  return new Promise((resolve) => {
    // On Linux, cap the address space (and CPU seconds) of the submitted program.
    const child = process.platform === 'linux'
      ? spawn('/bin/sh', ['-c', `ulimit -v ${MEMORY_KB} -t 20 -f 65536; exec "$0"`, prog.bin], { cwd: prog.dir, env: {}, stdio: ['pipe', 'pipe', 'pipe'] })
      : spawn(prog.bin, [], { cwd: prog.dir, env: {}, stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks = [];
    let size = 0, stderr = '', timedOut = false, overflow = false;
    const t0 = performance.now();
    // Wall-clock limit with a little slack for process start-up.
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeLimitMs + 100);
    child.stdout.on('data', (d) => {
      size += d.length;
      if (size > MAX_OUTPUT) { overflow = true; child.kill('SIGKILL'); } else chunks.push(d);
    });
    child.stderr.on('data', (d) => { if (stderr.length < 4000) stderr += d; });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const timeMs = performance.now() - t0;
      const stdout = Buffer.concat(chunks).toString('utf8');
      if (timedOut) return resolve({ status: 'tle', stdout: '', timeMs: timeLimitMs, message: `Exceeded the time limit of ${timeLimitMs} ms.` });
      if (overflow) return resolve({ status: 're', stdout: '', timeMs, message: 'Output limit exceeded.' });
      if (code !== 0) return resolve({ status: 're', stdout, timeMs, message: `${signal ? `Killed by ${signal}` : `Exit code ${code}`}${stderr ? `\n${stderr.trim()}` : ''}` });
      resolve({ status: 'ok', stdout, timeMs });
    });
  });
}


// ---- authentication and fair use -------------------------------------------------------------
/** token -> {uid, until}. A token is verified by asking Supabase, which also checks the invitation. */
const verified = new Map();
async function authenticate(req) {
  const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
  if (!token) return null;
  const hit = verified.get(token);
  if (hit && hit.until > Date.now()) return hit.uid;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/am_i_allowed`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: '{}',
    });
    if (!res.ok || (await res.json()) !== true) return null;
    // The signature was just verified by Supabase, so reading the subject from the payload is safe.
    const uid = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub;
    if (verified.size > 1000) verified.clear();
    verified.set(token, { uid, until: Date.now() + 60_000 });
    return uid;
  } catch {
    return null;
  }
}

const hits = new Map();
function allow(uid, kind) {
  const { n, perMs } = LIMITS[kind];
  const key = `${uid}:${kind}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < perMs);
  if (recent.length >= n) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** At most MAX_PARALLEL compilations or runs at once; the rest wait their turn. */
let active = 0;
const waiting = [];
async function slot(fn) {
  if (active >= MAX_PARALLEL) await new Promise((r) => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; waiting.shift()?.(); }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let n = 0;
    req.on('data', (d) => {
      n += d.length;
      if (n > MAX_BODY) { reject(new Error('Body too large')); req.destroy(); } else parts.push(d);
    });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

createServer(async (req, res) => {
  const send = (status, body) => {
    const origin = ALLOWED_ORIGIN ?? (AUTH ? undefined : '*');
    res.writeHead(status, {
      'content-type': 'application/json',
      ...(origin ? { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'content-type, authorization' } : {}),
      'x-content-type-options': 'nosniff',
    });
    res.end(JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') return send(204, {});
  try {
    if (req.method === 'GET' && req.url === '/api/health') return send(200, { ok: true, compiler: CXX });
    let uid = 'local';
    if (AUTH && req.method === 'POST' && req.url?.startsWith('/api/')) {
      uid = await authenticate(req);
      if (!uid) return send(401, { error: 'Sign in with an invited account.' });
      if (!allow(uid, req.url === '/api/compile' ? 'compile' : 'run')) return send(429, { error: 'Too many requests.' });
    }
    if (req.method === 'POST' && req.url === '/api/compile') {
      const { code } = await readJson(req);
      if (typeof code !== 'string' || code.length > 100_000) return send(400, { error: 'Invalid code.' });
      return send(200, await slot(() => compile(code)));
    }
    if (req.method === 'POST' && req.url === '/api/run') {
      const { id, input, timeLimitMs } = await readJson(req);
      if (typeof id !== 'string' || typeof input !== 'string') return send(400, { error: 'Invalid request.' });
      return send(200, await slot(() => run(id, input, Math.min(Math.max(Number(timeLimitMs) || 2000, 100), 20_000))));
    }
    if (req.method === 'POST' && req.url === '/api/runmany') {
      // Several tests in one round trip: much faster than one request per test on a remote host.
      const { id, inputs, timeLimitMs } = await readJson(req);
      if (typeof id !== 'string' || !Array.isArray(inputs) || inputs.length > 50 || inputs.some((x) => typeof x !== 'string')) return send(400, { error: 'Invalid request.' });
      const limit = Math.min(Math.max(Number(timeLimitMs) || 2000, 100), 20_000);
      return send(200, await slot(async () => {
        const results = [];
        let tles = 0;
        for (const input of inputs) {
          const r = await run(id, input, limit);
          results.push(r);
          if (r.status === 'tle' && ++tles >= 2) break;
        }
        return { results };
      }));
    }
    if (req.method === 'GET' && STATIC_DIR) {
      const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
      let file = join(STATIC_DIR, path);
      if (!file.startsWith(STATIC_DIR) || !existsSync(file) || statSync(file).isDirectory()) file = join(STATIC_DIR, 'index.html');
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      return res.end(readFileSync(file));
    }
    send(404, { error: 'Not found' });
  } catch (e) {
    send(400, { error: String(e?.message ?? e) });
  }
}).listen(PORT, HOST, () => console.log(`Judge listening on http://${HOST}:${PORT} (compiler: ${CXX}, auth: ${AUTH ? 'on' : 'off'})`));
