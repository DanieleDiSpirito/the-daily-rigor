/* Sanity checks for the content: references vs samples, references vs brute force,
   timing of references on the hidden tests, and Monte Carlo checks of puzzle answers. */
import { codingProblems } from '../src/content/code';
import { mathPuzzles } from '../src/content/math';
import { papers } from '../src/content/papers';
import { tokens, rng } from '../src/lib/rng';
import { renderRich } from '../src/components/Rich';

let failures = 0;
const fail = (m: string) => { failures++; console.error('FAIL', m); };
const same = (a: string, b: string) => tokens(a).join(' ') === tokens(b).join(' ');

for (const p of codingProblems) {
  for (const [i, s] of p.samples.entries()) {
    const ref = p.reference(s.input);
    const ok = p.check ? p.check(s.input, s.output, ref) === null && p.check(s.input, ref, ref) === null : same(ref, s.output);
    if (!ok) fail(`${p.id} sample ${i + 1}: reference gives ${JSON.stringify(ref)}`);
  }
  const t0 = performance.now();
  const tests = p.generateTests();
  let worst = 0;
  for (const t of tests) {
    const a = performance.now();
    const out = p.reference(t.input);
    worst = Math.max(worst, performance.now() - a);
    if (p.check && p.check(t.input, out, out) !== null) fail(`${p.id}: checker rejects reference`);
  }
  console.log(`${p.id}: ${tests.length} tests, gen+ref ${Math.round(performance.now() - t0)} ms, worst ref ${Math.round(worst)} ms`);
}

// Brute-force cross-checks on small inputs.
const r = rng(9);
const byId = Object.fromEntries(codingProblems.map((p) => [p.id, p]));
for (let it = 0; it < 300; it++) {
  { const l = r.int(1, 60), rr = r.int(l, 80); let x = 0; for (let v = l; v <= rr; v++) x ^= v;
    if (!same(byId['range-xor'].reference(`1\n${l} ${rr}`), String(x))) fail(`xor ${l} ${rr}`); }
  { const n = r.int(1, 12), k = r.int(1, 7); const a = Array.from({ length: n }, () => r.int(-9, 9)); let c = 0;
    for (let i = 0; i < n; i++) { let s = 0; for (let j = i; j < n; j++) { s += a[j]; if (s % k === 0) c++; } }
    if (!same(byId['divisible-subarrays'].reference(`${n} ${k}\n${a.join(' ')}`), String(c))) fail(`div ${a} ${k}`); }
  { const n = r.int(1, 300); let s = 0; for (let i = 1; i <= n; i++) s += Math.floor(n / i);
    if (!same(byId['sum-of-floors'].reference(`1\n${n}`), String(s))) fail(`floors ${n}`); }
  { const n = r.int(2, 8), k = r.int(2, n); const set = new Set<number>(); while (set.size < n) set.add(r.int(0, 30)); const x = [...set].sort((a, b) => a - b);
    let best = 0; for (let m = 0; m < 1 << n; m++) { const pick = x.filter((_, i) => m >> i & 1); if (pick.length !== k) continue; let d = Infinity; for (let i = 1; i < k; i++) d = Math.min(d, pick[i] - pick[i - 1]); best = Math.max(best, d); }
    if (!same(byId['spread-the-routers'].reference(`${n} ${k}\n${[...set].join(' ')}`), String(best))) fail(`routers`); }
  { const h = r.int(1, 5), w = r.int(1, 5); const g = Array.from({ length: h }, () => Array.from({ length: w }, () => (r.next() < 0.25 ? '#' : '.')).join(''));
    const f = (i: number, j: number): number => (i >= h || j >= w || g[i][j] === '#' ? 0 : i === h - 1 && j === w - 1 ? 1 : f(i + 1, j) + f(i, j + 1));
    if (!same(byId['grid-craters'].reference(`${h} ${w}\n${g.join('\n')}`), String(f(0, 0)))) fail(`grid ${g}`); }
  { const k = r.int(1, 4), n = r.int(1, 14); const s = Array.from({ length: n }, () => 'abcde'[r.int(0, 4)]).join(''); let best = 0;
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) if (new Set(s.slice(i, j + 1)).size <= k) best = Math.max(best, j - i + 1);
    if (!same(byId['k-distinct-window'].reference(`${k}\n${s}`), String(best))) fail(`window ${s} ${k}`); }
}

// Brute-force cross-checks for the second batch of problems.
const ref = (id: string, input: string) => byId[id].reference(input);
for (let it = 0; it < 200; it++) {
  { const n = r.int(1, 10), S = r.int(-6, 6); const a = Array.from({ length: n }, () => r.int(-4, 4)); let c = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (a[i] + a[j] === S) c++;
    if (!same(ref('pair-sums', `${n} ${S}\n${a.join(' ')}`), String(c))) fail(`pair-sums ${a} ${S}`); }
  { const n = r.int(1, 12); const a = Array.from({ length: n }, () => r.int(-5, 5)); const f = a.map(() => 1);
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (a[j] < a[i]) f[i] = Math.max(f[i], f[j] + 1);
    if (!same(ref('longest-rise', `${n}\n${a.join(' ')}`), String(Math.max(...f)))) fail(`lis ${a}`); }
  { const n = r.int(1, 4), X = r.int(1, 30); const set = new Set<number>(); while (set.size < n) set.add(r.int(1, 12)); const c = [...set];
    let best = -1; // BFS over amounts
    const dist = new Map<number, number>([[0, 0]]); let frontier = [0];
    while (frontier.length && best < 0) { const nx: number[] = []; for (const v of frontier) for (const k of c) { const u = v + k; if (u <= X && !dist.has(u)) { dist.set(u, dist.get(v)! + 1); nx.push(u); } } frontier = nx; if (dist.has(X)) best = dist.get(X)!; }
    if (!same(ref('fewest-coins', `${n} ${X}\n${c.join(' ')}`), String(best))) fail(`coins ${c} ${X}`); }
  { const h = r.int(1, 5), w = r.int(1, 5); const g = Array.from({ length: h }, () => Array.from({ length: w }, () => (r.next() < 0.3 ? '#' : '.')));
    g[0][0] = '.'; g[h - 1][w - 1] = '.';
    const d = Array.from({ length: h }, () => new Array<number>(w).fill(Infinity)); d[0][0] = 0;
    for (let rep = 0; rep < h * w; rep++) for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) if (g[i][j] === '.')
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x >= 0 && y >= 0 && x < h && y < w && g[x][y] === '.') d[i][j] = Math.min(d[i][j], d[x][y] + 1); }
    const exp = d[h - 1][w - 1] === Infinity ? -1 : d[h - 1][w - 1];
    if (!same(ref('maze-runner', `${h} ${w}\n${g.map((q) => q.join('')).join('\n')}`), String(exp))) fail(`maze ${g.map((q) => q.join(''))}`); }
  { const n = r.int(1, 5), m = r.int(0, 7); const es = Array.from({ length: m }, () => [r.int(1, n), r.int(1, n), r.int(1, 9)]); let best = Infinity;
    for (let mask = 0; mask < 1 << m; mask++) { const p = Array.from({ length: n + 1 }, (_, i) => i); const f = (x: number): number => (p[x] === x ? x : (p[x] = f(p[x]))); let cost = 0, comps = n;
      for (let i = 0; i < m; i++) if (mask >> i & 1) { const [u, v, w] = es[i]; cost += w; const a = f(u), b = f(v); if (a !== b) { p[a] = b; comps--; } }
      if (comps === 1) best = Math.min(best, cost); }
    if (!same(ref('cheapest-network', `${n} ${m}\n${es.map((e) => e.join(' ')).join('\n')}`), String(best === Infinity ? -1 : best))) fail(`mst ${JSON.stringify(es)}`); }
  { const n = r.int(1, 12); const a = Array.from({ length: n }, () => r.int(1, 6)); const e = a.map((x, i) => { for (let j = i + 1; j < n; j++) if (a[j] > x) return j - i; return 0; });
    if (!same(ref('next-taller', `${n}\n${a.join(' ')}`), e.join(' '))) fail(`taller ${a}`); }
  { const q = 3; const qs = Array.from({ length: q }, () => { const l = r.int(1, 200), rr = r.int(l, 300); return [l, rr]; });
    const isP = (x: number) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
    const exp = qs.map(([l, rr]) => { let c = 0; for (let x = l; x <= rr; x++) if (isP(x)) c++; return c; });
    if (!same(ref('prime-census', `${q}\n${qs.map((e) => e.join(' ')).join('\n')}`), exp.join(' '))) fail(`primes ${JSON.stringify(qs)}`); }
  { const n = r.int(1, 10), W = r.int(1, 20); const its = Array.from({ length: n }, () => [r.int(1, W), r.int(1, 30)]); let best = 0;
    for (let mask = 0; mask < 1 << n; mask++) { let w = 0, v = 0; for (let i = 0; i < n; i++) if (mask >> i & 1) { w += its[i][0]; v += its[i][1]; } if (w <= W) best = Math.max(best, v); }
    if (!same(ref('loot-bag', `${n} ${W}\n${its.map((e) => e.join(' ')).join('\n')}`), String(best))) fail(`knapsack ${JSON.stringify(its)} ${W}`); }
  { const gen = (len: number) => Array.from({ length: len }, () => 'abc'[r.int(0, 2)]).join(''); const a = gen(r.int(1, 7)), b = gen(r.int(1, 7));
    const memo = new Map<string, number>(); const d = (i: number, j: number): number => { if (i === 0) return j; if (j === 0) return i; const k = `${i},${j}`; const c = memo.get(k); if (c !== undefined) return c;
      const v = a[i - 1] === b[j - 1] ? d(i - 1, j - 1) : 1 + Math.min(d(i - 1, j), d(i, j - 1), d(i - 1, j - 1)); memo.set(k, v); return v; };
    if (!same(ref('word-morph', `${a}\n${b}`), String(d(a.length, b.length)))) fail(`edit ${a} ${b}`); }
  { const n = r.int(1, 8), m = r.int(1, 10); const es = Array.from({ length: m }, () => [r.int(1, n), r.int(1, n)]); const lab = Array.from({ length: n + 1 }, (_, i) => i); const exp: number[] = [];
    for (const [a, b] of es) { const la = lab[a], lb = lab[b]; for (let i = 1; i <= n; i++) if (lab[i] === lb) lab[i] = la; const cnt = new Map<number, number>(); for (let i = 1; i <= n; i++) cnt.set(lab[i], (cnt.get(lab[i]) ?? 0) + 1); exp.push(Math.max(...cnt.values())); }
    if (!same(ref('friend-circles', `${n} ${m}\n${es.map((e) => e.join(' ')).join('\n')}`), exp.join(' '))) fail(`circles ${JSON.stringify(es)}`); }
  { const n = r.int(1, 9); const a = Array.from({ length: n }, () => r.int(-9, 9)); let best = -Infinity;
    for (let s = 0; s < n; s++) { let sum = 0; for (let len = 1; len <= n; len++) { sum += a[(s + len - 1) % n]; best = Math.max(best, sum); } }
    if (!same(ref('circular-fortune', `${n}\n${a.join(' ')}`), String(best))) fail(`circular ${a}`); }
  { const n = r.int(1, 6); const iv = Array.from({ length: n }, () => { const l = r.int(0, 20); return [l, r.int(l + 1, 25)]; }); const cell = new Set<number>();
    for (const [l, rr] of iv) for (let x = l; x < rr; x++) cell.add(x);
    if (!same(ref('paint-coverage', `${n}\n${iv.map((e) => e.join(' ')).join('\n')}`), String(cell.size))) fail(`paint ${JSON.stringify(iv)}`); }
  { const n = r.int(1, 10), S = r.int(1, 40); const a = Array.from({ length: n }, () => r.int(1, 9)); let best = Infinity;
    for (let i = 0; i < n; i++) { let s = 0; for (let j = i; j < n; j++) { s += a[j]; if (s >= S) { best = Math.min(best, j - i + 1); break; } } }
    if (!same(ref('shortest-cover', `${n} ${S}\n${a.join(' ')}`), String(best === Infinity ? -1 : best))) fail(`cover ${a} ${S}`); }
}

// ---- Reinforcement-learning week: independent brute-force checks ----
{
  const P = 998244353n;
  const md = (x: bigint) => ((x % P) + P) % P;
  const pw = (b: bigint, e: bigint) => { let res = 1n; b = md(b); while (e > 0n) { if (e & 1n) res = (res * b) % P; b = (b * b) % P; e >>= 1n; } return res; };
  const inv = (x: bigint) => pw(x, P - 2n);
  for (let it = 0; it < 300; it++) {
    { // returns-to-go: direct discounted sums to the end of each episode
      const n = r.int(1, 9), a = r.int(0, 6), b = r.int(Math.max(a, 1), 7); const rs = Array.from({ length: n }, () => r.int(-9, 9)); const ds = Array.from({ length: n }, (_, i) => (i === n - 1 || r.next() < 0.3 ? 1 : 0));
      const g = BigInt(a) * inv(BigInt(b)) % P; const exp: string[] = [];
      for (let i = 0; i < n; i++) { let tot = 0n, f = 1n; for (let k = i; k < n; k++) { tot = md(tot + f * BigInt(rs[k])); f = f * g % P; if (ds[k]) break; } exp.push(String(tot)); }
      if (!same(ref('returns-to-go', `${n} ${a} ${b}\n${rs.join(' ')}\n${ds.join(' ')}\n`), exp.join(' '))) fail(`returns ${rs} ${ds} ${a}/${b}`); }
    { // q-table-rewind: independent simulation with explicit rounding towards zero
      const S = r.int(1, 4), A = r.int(1, 3), Tn = r.int(1, 25); const tr = Array.from({ length: Tn }, () => [r.int(0, S - 1), r.int(0, A - 1), r.int(-12, 12), r.int(0, S - 1)]);
      const q = Array.from({ length: S }, () => new Array<number>(A).fill(0));
      for (const [s0, a0, rw, s1] of tr) { let best = -Infinity; for (let b = 0; b < A; b++) best = Math.max(best, q[s1][b]); const x = rw + best - q[s0][a0]; q[s0][a0] += x >= 0 ? Math.floor(x / 2) : -Math.floor(-x / 2); }
      if (!same(ref('q-table-rewind', `${S} ${A} ${Tn}\n${tr.map((e) => e.join(' ')).join('\n')}\n`), q.map((row) => row.join(' ')).join('\n'))) fail(`q-table ${JSON.stringify(tr)}`); }
    { // first-visit-values: forward scan summing the rewards that follow the first visit
      const N = r.int(1, 5), E = r.int(1, 4); const eps = Array.from({ length: E }, () => Array.from({ length: r.int(1, 6) }, () => [r.int(0, N - 1), r.int(-9, 9)]));
      const sum = new Array<number>(N).fill(0), cnt = new Array<number>(N).fill(0);
      for (const ep of eps) for (let t = 0; t < ep.length; t++) if (ep.findIndex(([s0]) => s0 === ep[t][0]) === t) { sum[ep[t][0]] += ep.slice(t).reduce((acc, [, rw]) => acc + rw, 0); cnt[ep[t][0]]++; }
      const g2 = (x: number, y: number): number => (y ? g2(y, x % y) : Math.abs(x));
      const exp = sum.map((v, i) => (cnt[i] ? `${v / g2(v, cnt[i])}/${cnt[i] / g2(v, cnt[i])}` : '-'));
      if (!same(ref('first-visit-values', `${N} ${E}\n${eps.map((ep) => `${ep.length} ${ep.map((e) => e.join(' ')).join(' ')}`).join('\n')}\n`), exp.join(' '))) fail(`first-visit ${JSON.stringify(eps)}`); }
    { // corridor-hitting-time: exact rational Gaussian elimination
      const n = r.int(1, 6); const pr = Array.from({ length: n - 1 }, () => { const b = r.int(1, 9); return [r.int(1, b), b]; });
      type Fr = [bigint, bigint]; const gc = (x: bigint, y: bigint): bigint => (y ? gc(y, x % y) : x < 0n ? -x : x);
      const nf = (x: bigint, y: bigint): Fr => { if (y < 0n) { x = -x; y = -y; } const d = gc(x, y) || 1n; return [x / d, y / d]; };
      const add = (u: Fr, v: Fr) => nf(u[0] * v[1] + v[0] * u[1], u[1] * v[1]), mul = (u: Fr, v: Fr) => nf(u[0] * v[0], u[1] * v[1]), dv = (u: Fr, v: Fr) => nf(u[0] * v[1], u[1] * v[0]);
      const M: Fr[][] = Array.from({ length: n }, () => new Array<Fr>(n + 1).fill([0n, 1n]));
      M[0][0] = [1n, 1n]; if (n > 1) M[0][1] = [-1n, 1n]; M[0][n] = [1n, 1n];
      for (let i = 1; i < n; i++) { const [a0, b0] = pr[i - 1]; M[i][i] = [1n, 1n]; M[i][i - 1] = nf(-BigInt(b0 - a0), BigInt(b0)); if (i + 1 < n) M[i][i + 1] = nf(-BigInt(a0), BigInt(b0)); M[i][n] = [1n, 1n]; }
      for (let c = 0; c < n; c++) { let piv = c; while (M[piv][c][0] === 0n) piv++; [M[c], M[piv]] = [M[piv], M[c]]; for (let rr = 0; rr < n; rr++) if (rr !== c && M[rr][c][0] !== 0n) { const f = dv(M[rr][c], M[c][c]); for (let k = c; k <= n; k++) M[rr][k] = add(M[rr][k], mul([-f[0], f[1]], M[c][k])); } }
      const e0 = dv(M[0][n], M[0][0]);
      if (!same(ref('corridor-policy-eval', `${n}\n${pr.map((e) => e.join(' ')).join('\n')}\n`), String(md(e0[0]) * inv(e0[1]) % P))) fail(`corridor ${JSON.stringify(pr)}`); }
    { // replay-sum-tree: linear scan over the prefix sums
      const n = r.int(1, 8), q = r.int(1, 14); const pri = Array.from({ length: n }, () => r.int(0, 5)); if (!pri.some((x) => x > 0)) pri[0] = 2; const cur = [...pri]; const lines: string[] = []; const exp: number[] = [];
      for (let k = 0; k < q; k++) { if (r.next() < 0.4) { const i = r.int(0, n - 1), x = r.int(0, 5); const old = cur[i]; cur[i] = x; if (!cur.some((y) => y > 0)) cur[i] = old; lines.push(`1 ${i + 1} ${cur[i]}`); }
        else { const tot = cur.reduce((a, b) => a + b, 0), v = r.int(0, tot - 1); let acc = 0, idx = 0; for (let i = 0; i < n; i++) { acc += cur[i]; if (acc > v) { idx = i + 1; break; } } lines.push(`2 ${v}`); exp.push(idx); } }
      if (exp.length && !same(ref('replay-sum-tree', `${n} ${q}\n${pri.join(' ')}\n${lines.join('\n')}\n`), exp.join(' '))) fail(`sum-tree ${pri} ${lines}`); }
    { // n-step-targets: direct sums, O(T n)
      const Tn = r.int(1, 9), n = r.int(1, Tn), a = r.int(1, 6), b = r.int(a, 7); const rs = Array.from({ length: Tn }, () => r.int(-9, 9)), vs = Array.from({ length: Tn + 1 }, () => r.int(-9, 9));
      const g = BigInt(a) * inv(BigInt(b)) % P; const exp: string[] = [];
      for (let t = 0; t < Tn; t++) { const m = Math.min(n, Tn - t); let tot = 0n, f = 1n; for (let k = 0; k < m; k++) { tot = md(tot + f * BigInt(rs[t + k])); f = f * g % P; } exp.push(String(md(tot + f * BigInt(vs[t + m])))); }
      if (!same(ref('n-step-targets', `${Tn} ${n} ${a} ${b}\n${rs.join(' ')}\n${vs.join(' ')}\n`), exp.join(' '))) fail(`n-step ${rs} ${vs} ${n} ${a}/${b}`); }
    { // optimal-plan-count: enumerate every path
      const n = r.int(2, 6); const es: number[][] = []; for (let i = 1; i < n; i++) es.push([i, i + 1, r.int(-2, 2)]); for (let k = r.int(0, 6); k > 0; k--) { const u = r.int(1, n - 1); es.push([u, r.int(u + 1, n), r.int(-2, 2)]); }
      let best = -Infinity, cnt = 0; const dfs = (u: number, tot: number) => { if (u === n) { if (tot > best) { best = tot; cnt = 1; } else if (tot === best) cnt++; return; } for (const [x, y, w] of es) if (x === u) dfs(y, tot + w); };
      dfs(1, 0);
      if (!same(ref('optimal-plan-count', `${n} ${es.length}\n${es.map((e) => e.join(' ')).join('\n')}\n`), `${best} ${cnt}`)) fail(`plans ${JSON.stringify(es)}`); }
  }
}
// Binomials mod p against exact BigInt Pascal rows.
{ const P = 1_000_000_007n; const qs: [number, number][] = []; const exp: bigint[] = [];
  for (let n = 0; n <= 120; n += 7) { let c = 1n; for (let k = 0; k <= n; k++) { qs.push([n, k]); exp.push(c % P); c = (c * BigInt(n - k)) / BigInt(k + 1); } }
  if (!same(ref('choose-mod', `${qs.length}\n${qs.map((e) => e.join(' ')).join('\n')}`), exp.join(' '))) fail('choose-mod'); }
// No-neighbours: existence claims for small n by brute force.
for (let n = 1; n <= 8; n++) {
  const perm = (a: number[]): number[][] => a.length <= 1 ? [a] : a.flatMap((x, i) => perm([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  const exists = perm(Array.from({ length: n }, (_, i) => i + 1)).some((p) => p.every((v, i) => i === 0 || Math.abs(v - p[i - 1]) !== 1));
  const ref = byId['no-neighbours'].reference(`1\n${n}`);
  if ((ref.trim() === '-1') === exists) fail(`no-neighbours n=${n}`);
}

// Monte Carlo / exact checks of puzzle answers.
const N = 400_000;
const mc: Record<string, () => number> = {
  'broken-stick': () => { let c = 0; for (let i = 0; i < N; i++) { const a = Math.random(), b = Math.random(); const x = Math.min(a, b), y = Math.max(a, b); if (x < 0.5 && y - x < 0.5 && y > 0.5) c++; } return c / N; },
  'waiting-for-hh': () => { let s = 0; for (let i = 0; i < N; i++) { let n = 0, prev = false; for (;;) { n++; const h = Math.random() < 0.5; if (h && prev) break; prev = h; } s += n; } return s / N; },
  'coupon-collector-die': () => { let s = 0; for (let i = 0; i < N; i++) { let seen = 0, n = 0; while (seen !== 63) { seen |= 1 << Math.floor(Math.random() * 6); n++; } s += n; } return s / N; },
  'tuesday-boy': () => { let c = 0, b = 0; for (let i = 0; i < 4 * N; i++) { const k = [0, 1].map(() => [Math.random() < 0.5, Math.floor(Math.random() * 7)] as const); if (k.some(([boy, d]) => boy && d === 2)) { c++; if (k.every(([boy]) => boy)) b++; } } return b / c; },
  'two-eggs': () => { let k = 0; while ((k * (k + 1)) / 2 < 100) k++; return k; },
  'poisoned-cask-ternary': () => { let n = 0; while (3 ** n < 1000) n++; return n; },
  'hats-parity': () => 99,
  'ten-envelopes': () => { let d = [1, 0]; for (let n = 2; n <= 10; n++) d.push((n - 1) * (d[n - 1] + d[n - 2])); return d[10]; },
  'gamblers-ruin': () => { let w = 0; for (let i = 0; i < N; i++) { let c = 3; while (c > 0 && c < 10) c += Math.random() < 0.5 ? 1 : -1; if (c === 10) w++; } return w / N; },
  'two-sixes': () => { let s = 0; for (let i = 0; i < N; i++) { let n = 0, prev = false; for (;;) { n++; const six = Math.random() < 1 / 6; if (six && prev) break; prev = six; } s += n; } return s / N; },
  'no-adjacent-ones': () => { let c = 0; for (let m = 0; m < 1 << 12; m++) if ((m & (m >> 1)) === 0) c++; return c; },
  'josephus-100': () => { const q = Array.from({ length: 100 }, (_, i) => i + 1); while (q.length > 1) { q.push(q.shift()!); q.shift(); } return q[0]; },
  'staying-below-diagonal': () => { const f = Array.from({ length: 11 }, () => new Array<number>(11).fill(0)); f[0][0] = 1; for (let x = 0; x <= 10; x++) for (let y = 0; y <= x; y++) { if (x === 0 && y === 0) continue; f[x][y] = (x > 0 && y <= x - 1 ? f[x - 1][y] : 0) + (y > 0 ? f[x][y - 1] : 0); } return f[10][10]; },
  'first-ace': () => { let s = 0; for (let i = 0; i < N; i++) { const deck = Array.from({ length: 52 }, (_, j) => j); for (let j = 51; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [deck[j], deck[k]] = [deck[k], deck[j]]; } s += deck.findIndex((c) => c < 4) + 1; } return s / N; },
  'domino-3x8': () => { const W = 8, grid = Array.from({ length: 3 }, () => new Array<boolean>(W).fill(false)); const go = (pos: number): number => { if (pos === 3 * W) return 1; const i = Math.floor(pos / W), j = pos % W; if (grid[i][j]) return go(pos + 1); let t = 0; grid[i][j] = true; if (j + 1 < W && !grid[i][j + 1]) { grid[i][j + 1] = true; t += go(pos + 1); grid[i][j + 1] = false; } if (i + 1 < 3 && !grid[i + 1][j]) { grid[i + 1][j] = true; t += go(pos + 1); grid[i + 1][j] = false; } grid[i][j] = false; return t; }; return go(0); },
  'five-bits': () => { let c = 0; for (let n = 1; n <= 2026; n++) { let b = 0, x = n; while (x) { b += x & 1; x >>= 1; } if (b === 5) c++; } return c; },
  'digit-sum-twenty': () => { let c = 0; for (let n = 1; n <= 1_000_000; n++) { let s = 0, x = n; while (x) { s += x % 10; x = Math.floor(x / 10); } if (s === 20) c++; } return c; },
  'three-heads-in-a-row': () => { let s = 0; for (let i = 0; i < N; i++) { let n = 0, run = 0; while (run < 3) { n++; run = Math.random() < 0.5 ? run + 1 : 0; } s += n; } return s / N; },
  'cube-walk': () => { let s = 0; for (let i = 0; i < N; i++) { let v = 0, n = 0; while (v !== 7) { v ^= 1 << Math.floor(Math.random() * 3); n++; } s += n; } return s / N; },
  'hundred-prisoners': () => { const T = 40_000; let ok = 0; for (let t = 0; t < T; t++) { const p = Array.from({ length: 100 }, (_, i) => i); for (let j = 99; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [p[j], p[k]] = [p[k], p[j]]; } const seen = new Array<boolean>(100).fill(false); let good = true; for (let i = 0; i < 100 && good; i++) if (!seen[i]) { let len = 0, x = i; while (!seen[x]) { seen[x] = true; x = p[x]; len++; } if (len > 50) good = false; } if (good) ok++; } return ok / T; },
  // Reinforcement-learning week (each answer is recomputed independently, see the tolerance note below).
  'two-state-chain': () => { let a = 0, b = 0; for (let i = 0; i < 200; i++) { const na = 1 + 0.5 * (0.5 * a + 0.5 * b), nb = 0.5 * ((1 / 3) * a + (2 / 3) * b); a = na; b = nb; } return a; },
  'sarsa-vs-q': () => { const q = 2 + 0.5 * (1 + 0.9 * 5 - 2), s = 2 + 0.5 * (1 + 0.9 * 4 - 2); return q - s; },
  'corridor-hitting-time': () => { const n = 10, M = Array.from({ length: n }, () => new Array<number>(n + 1).fill(0)); M[0][0] = 1; M[0][1] = -1; M[0][n] = 1; for (let i = 1; i < n; i++) { M[i][i] = 1; M[i][i - 1] = -0.5; if (i + 1 < n) M[i][i + 1] = -0.5; M[i][n] = 1; } for (let c = 0; c < n; c++) { for (let rr = 0; rr < n; rr++) if (rr !== c) { const f = M[rr][c] / M[c][c]; for (let k = c; k <= n; k++) M[rr][k] -= f * M[c][k]; } } return Math.round(M[0][n] / M[0][0]); },
  'discounted-walk': () => { const g = 0.9, V = [0, 0, 0, 0]; for (let it = 0; it < 2000; it++) { const n = [g * V[1], g * 0.5 * (V[0] + V[2]), g * 0.5 * (V[1] + V[3]), 0.5 * 1 + g * 0.5 * V[2]]; for (let i = 0; i < 4; i++) V[i] = n[i]; } return V[0]; },
  'value-iteration-bound': () => { let k = 0; while (10 * 0.9 ** k >= 0.01) k++; return k; },
  'step-size-memory': () => { let n = 0; while (0.9 ** n >= 0.01) n++; return n; },
  'importance-sampling-variance': () => { const b = [0.5, 0.25, 0.25], pi = [0, 0.5, 0.5], R = [1, 2, 3]; let m = 0, m2 = 0; for (let i = 0; i < 3; i++) { m += b[i] * (pi[i] / b[i]) * R[i]; m2 += b[i] * ((pi[i] / b[i]) * R[i]) ** 2; } return m2 - m * m; },
  'ants-collisions': () => { let best = 0; for (let r = 0; r <= 25; r++) best = Math.max(best, r * (25 - r)); return best; },
};
for (const p of mathPuzzles) {
  const f = mc[p.id];
  if (!f) { fail(`no check for ${p.id}`); continue; }
  const v = f();
  const rlExact = ['two-state-chain', 'sarsa-vs-q', 'discounted-walk', 'importance-sampling-variance'].includes(p.id);
  const tol = rlExact ? 1e-9 : Math.max(p.tolerance, 0) === 0 ? 0 : 0.02;
  const ok = tol === 0 ? v === p.answer : Math.abs(v - p.answer) <= tol * Math.max(1, p.answer);
  console.log(`${p.id}: expected ${p.answer.toFixed(4)}, check ${v.toFixed(4)} ${ok ? 'ok' : 'MISMATCH'}`);
  if (!ok) fail(p.id);
}

// Ids must be unique across the three sections too (progress is keyed by id).
{ const ids = [...mathPuzzles, ...codingProblems, ...papers].map((x) => x.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) fail(`duplicate ids: ${dup}`); }

// Quiz sanity and math rendering.
for (const p of papers) for (const [i, q] of p.quiz.entries()) if (q.correct < 0 || q.correct >= q.options.length) fail(`${p.id} q${i}`);
const all = [...mathPuzzles.flatMap((p) => [p.statement, p.solution, ...p.hints]), ...codingProblems.flatMap((p) => [p.legend, p.inputSpec, p.outputSpec, p.editorial, ...p.samples.map((s) => s.note ?? '')]), ...papers.flatMap((p) => [p.summary, p.whyItMatters, p.readingGuide, ...p.quiz.flatMap((q) => [q.prompt, q.explanation, ...q.options])])];
for (const t of all) { const h = renderRich(t); if (h.includes('katex-error')) fail(`KaTeX error in: ${t.slice(0, 80)}`); }

console.log(failures ? `\n${failures} failure(s)` : '\nAll content checks passed.');
process.exit(failures ? 1 : 0);
