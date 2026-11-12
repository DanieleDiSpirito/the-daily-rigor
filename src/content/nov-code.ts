import type { CodingProblem, TestCase } from '../types';
import { rng, tokens } from '../lib/rng';

/* Late-November algorithm problems (23 – 30 Nov 2026): they follow the regular programme. */

const T = (input: string): TestCase => ({ input });

/** A binary min-heap of [key, value] pairs, ordered by key and then by value. */
class MinHeap {
  private a: [number, number][] = [];
  get size() { return this.a.length; }
  private less(x: [number, number], y: [number, number]) { return x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]); }
  push(key: number, value: number) {
    const a = this.a;
    a.push([key, value]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop(): [number, number] {
    const a = this.a, top = a[0], last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, rr = l + 1;
        let m = i;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (rr < a.length && this.less(a[rr], a[m])) m = rr;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}

/* ---------------------------------------------------------------- */

export const bracketRepair: CodingProblem = {
  id: 'bracket-repair',
  title: 'Mending the Brackets',
  rating: 1100,
  tags: ['greedy', 'strings', 'stack'],
  timeLimitMs: 2000,
  legend: `A string made of the characters \`(\` and \`)\` is **balanced** if every \`(\` can be matched with a later \`)\` in the usual way, so that each bracket belongs to exactly one pair.

You are given a string $s$. You may insert brackets of either kind at any positions (you may not delete or change any). Find the **minimum number of insertions** that make the string balanced.`,
  inputSpec: `The only line contains the string $s$ of \`(\` and \`)\` ($1 \\le |s| \\le 2 \\cdot 10^5$).`,
  outputSpec: `Print the minimum number of inserted brackets.`,
  samples: [
    { input: '())(\n', output: '2\n', note: `Insert a \`(\` at the start and a \`)\` at the end: \`(())()\`.` },
    { input: '(()())\n', output: '0\n' },
  ],
  generateTests() {
    const r = rng(2801);
    const out: TestCase[] = [T('())(\n'), T('(()())\n'), T(')\n'), T('(\n')];
    const rand = (n: number, p: number) => Array.from({ length: n }, () => (r.next() < p ? '(' : ')')).join('');
    out.push(T(rand(30, 0.5) + '\n'));
    out.push(T(`${'('.repeat(200000)}\n`));
    out.push(T(`${')'.repeat(200000)}\n`));
    out.push(T(`${'()'.repeat(100000)}\n`));
    out.push(T(`${'('.repeat(100000)}${')'.repeat(100000)}\n`));
    out.push(T(`${')'.repeat(100000)}${'('.repeat(100000)}\n`));
    out.push(T(`${rand(200000, 0.5)}\n`));
    out.push(T(`${rand(200000, 0.7)}\n`));
    return out;
  },
  reference(input) {
    const s = tokens(input)[0];
    let bal = 0, ins = 0;
    for (const c of s) {
      if (c === '(') bal++;
      else if (bal > 0) bal--;
      else ins++;
    }
    return String(ins + bal);
  },
  editorial: `Scan the string from left to right, keeping the number $b$ of currently unmatched \`(\`.

- A \`(\` increases $b$.
- A \`)\` with $b > 0$ matches one of them and decreases $b$.
- A \`)\` with $b = 0$ has nothing to match: it is unavoidable to insert a \`(\` somewhere before it. Count one insertion.

At the end, each of the $b$ unmatched \`(\` needs a \`)\` after it. The answer is the number of insertions made on the way plus $b$. Matching greedily is optimal because each closing bracket that can be matched with an earlier opening one saves exactly one insertion, and the choice of which one never matters. The running time is $O(|s|)$.`,
};

/* ---------------------------------------------------------------- */

export const countInversions: CodingProblem = {
  id: 'count-inversions',
  title: 'How Unsorted Is It?',
  rating: 1500,
  tags: ['data structures', 'fenwick tree', 'divide and conquer'],
  timeLimitMs: 2000,
  legend: `An **inversion** in a sequence $a_1, \\dots, a_n$ is a pair of positions $i < j$ with $a_i > a_j$. Equal values do not form an inversion.

Count the inversions of the given sequence.`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ integers $a_i$ ($1 \\le a_i \\le 10^9$).`,
  outputSpec: `Print the number of inversions. It may not fit in 32 bits.`,
  samples: [
    { input: '5\n3 1 2 5 4\n', output: '3\n', note: `The inversions are $(3,1)$, $(3,2)$ and $(5,4)$.` },
    { input: '4\n2 2 1 1\n', output: '4\n', note: `Each of the two 2s forms an inversion with each of the two 1s.` },
  ],
  generateTests() {
    const r = rng(2802);
    const out: TestCase[] = [T('5\n3 1 2 5 4\n'), T('4\n2 2 1 1\n'), T('1\n7\n')];
    const n = 200000;
    out.push(T(`12\n${Array.from({ length: 12 }, () => r.int(1, 6)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => n - i).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => i + 1).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => 1e9).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => r.int(1, 1e9)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => r.int(1, 5)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => (i < n / 2 ? 1e9 - i : 1e9 - n)).join(' ')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    const a = t.slice(1, 1 + n);
    const vals = [...new Set(a)].sort((x, y) => x - y);
    const rank = new Map(vals.map((v, i) => [v, i + 1]));
    const bit = new Array<number>(vals.length + 1).fill(0);
    let inv = 0;
    for (let i = 0; i < n; i++) {
      const k = rank.get(a[i])!;
      let le = 0;
      for (let x = k; x > 0; x -= x & -x) le += bit[x];
      inv += i - le; // elements seen so far that are strictly greater
      for (let x = k; x <= vals.length; x += x & -x) bit[x]++;
    }
    return String(inv);
  },
  editorial: `Counting pairs directly is $O(n^2)$, which is far too slow for $n = 2 \\cdot 10^5$.

**Fenwick tree.** Compress the values to ranks $1, \\dots, m$. Process the sequence from left to right, and for each element count how many of the elements seen so far are strictly greater: that is $i - (\\text{number seen with rank} \\le \\text{rank}(a_i))$, a prefix sum of a Fenwick tree that stores the counts. Then add the element to the tree. Total time $O(n \\log n)$.

**Merge sort** works as well: while merging two sorted halves, every time an element of the right half is placed before elements of the left half, those remaining left elements are all inversions with it (taking care with equal values).

The answer can reach $n(n-1)/2 \\approx 2 \\cdot 10^{10}$, so use 64-bit integers in C++.`,
};

/* ---------------------------------------------------------------- */

export const coprimePairs: CodingProblem = {
  id: 'coprime-pairs',
  title: 'Strangers in the Table',
  rating: 1500,
  tags: ['number theory', 'sieve', 'euler totient', 'prefix sums'],
  timeLimitMs: 2000,
  legend: `For a positive integer $n$ let $C(n)$ be the number of **ordered** pairs $(a, b)$ with $1 \\le a, b \\le n$ and $\\gcd(a, b) = 1$.

You are given $q$ values of $n$. Compute $C(n)$ for each of them.`,
  inputSpec: `The first line contains $q$ ($1 \\le q \\le 10^5$). Each of the next $q$ lines contains an integer $n$ ($1 \\le n \\le 10^6$).`,
  outputSpec: `For each query print $C(n)$ on its own line.`,
  samples: [
    { input: '3\n1\n3\n10\n', output: '1\n7\n63\n', note: `For $n = 3$ the pairs are $(1,1), (1,2), (2,1), (1,3), (3,1), (2,3), (3,2)$.` },
  ],
  generateTests() {
    const r = rng(2803);
    const out: TestCase[] = [T('3\n1\n3\n10\n'), T('1\n1000000\n'), T('2\n1\n2\n')];
    for (const q of [20, 1000, 100000]) {
      const lines = [String(q)];
      for (let i = 0; i < q; i++) lines.push(String(r.int(1, q === 20 ? 60 : 1e6)));
      out.push(T(lines.join('\n') + '\n'));
    }
    out.push(T(`100000\n${Array.from({ length: 100000 }, () => 1000000).join('\n')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const q = t[0];
    let mx = 1;
    for (let i = 1; i <= q; i++) mx = Math.max(mx, t[i]);
    const phi = new Int32Array(mx + 1);
    for (let i = 0; i <= mx; i++) phi[i] = i;
    for (let i = 2; i <= mx; i++) if (phi[i] === i) for (let j = i; j <= mx; j += i) phi[j] -= phi[j] / i;
    const pre = new Float64Array(mx + 1);
    for (let i = 1; i <= mx; i++) pre[i] = pre[i - 1] + phi[i];
    const res: string[] = [];
    for (let i = 1; i <= q; i++) res.push(String(2 * pre[t[i]] - 1));
    return res.join('\n');
  },
  editorial: `Count pairs by the larger element. For $b \\ge 2$ there are exactly $\\varphi(b)$ values $a < b$ coprime to $b$, and each gives two ordered pairs $(a,b)$ and $(b,a)$. The only pair with $a = b$ that is coprime is $(1,1)$. Therefore
$$C(n) = 2\\sum_{b=1}^{n} \\varphi(b) - 1.$$

Compute Euler's totient for every number up to $10^6$ with a sieve: start with $\\varphi(i) = i$ and, for every prime $p$ (a number still untouched when reached), do $\\varphi(j) \\mathrel{-}= \\varphi(j)/p$ for all multiples $j$ of $p$. Take prefix sums of $\\varphi$ and answer each query in $O(1)$.

Preprocessing is $O(M \\log\\log M)$ for $M = 10^6$. The prefix sums reach about $3 \\cdot 10^{11}$, which needs 64-bit integers.`,
};

/* ---------------------------------------------------------------- */

export const lexiTopo: CodingProblem = {
  id: 'lexi-topo',
  title: 'The Earliest Valid Order',
  rating: 1500,
  tags: ['graphs', 'topological sort', 'data structures', 'greedy'],
  timeLimitMs: 2000,
  legend: `A project has $n$ tasks numbered $1$ to $n$. There are $m$ requirements of the form "task $u$ must be done before task $v$".

Among all orders in which all the tasks can be done while respecting every requirement, find the **lexicographically smallest** one (compare the orders as sequences of numbers, first difference decides).`,
  inputSpec: `The first line contains $n$ and $m$ ($1 \\le n \\le 2 \\cdot 10^5$, $0 \\le m \\le 2 \\cdot 10^5$). Each of the next $m$ lines contains $u$ and $v$ ($1 \\le u, v \\le n$, $u \\ne v$): task $u$ must precede task $v$. The same requirement may appear several times.`,
  outputSpec: `Print the order as $n$ integers separated by spaces. If no order exists, print $-1$.`,
  samples: [
    { input: '4 3\n4 1\n3 1\n2 3\n', output: '2 3 4 1\n', note: `Only tasks 2 and 4 are free at the start; take 2, which frees 3; now 3 and 4 are free; take 3, then 4, then 1.` },
    { input: '3 3\n1 2\n2 3\n3 1\n', output: '-1\n', note: `The requirements form a cycle.` },
  ],
  generateTests() {
    const r = rng(2804);
    const out: TestCase[] = [T('4 3\n4 1\n3 1\n2 3\n'), T('3 3\n1 2\n2 3\n3 1\n'), T('1 0\n')];
    const dag = (n: number, m: number) => {
      const p = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = n - 1; i > 0; i--) { const j = r.int(0, i); [p[i], p[j]] = [p[j], p[i]]; }
      const lines = [`${n} ${m}`];
      for (let i = 0; i < m; i++) { const a = r.int(0, n - 2), b = r.int(a + 1, n - 1); lines.push(`${p[a]} ${p[b]}`); }
      return lines;
    };
    out.push(T(dag(8, 10).join('\n') + '\n'));
    const n = 200000;
    out.push(T(dag(n, 200000).join('\n') + '\n'));
    out.push(T(dag(n, 0).join('\n') + '\n'));
    // A single long chain in a shuffled labelling: the order is forced.
    {
      const p = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = n - 1; i > 0; i--) { const j = r.int(0, i); [p[i], p[j]] = [p[j], p[i]]; }
      const lines = [`${n} ${n - 1}`];
      for (let i = 0; i + 1 < n; i++) lines.push(`${p[i]} ${p[i + 1]}`);
      out.push(T(lines.join('\n') + '\n'));
      // The same chain closed into one big cycle.
      const cyc = [`${n} ${n}`, ...lines.slice(1), `${p[n - 1]} ${p[0]}`];
      out.push(T(cyc.join('\n') + '\n'));
    }
    // A star: everything must come after task n.
    out.push(T(`${n} ${n - 1}\n${Array.from({ length: n - 1 }, (_, i) => `${n} ${i + 1}`).join('\n')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], m = t[1];
    const head = new Int32Array(n + 1).fill(-1), nxt = new Int32Array(m), to = new Int32Array(m);
    const indeg = new Int32Array(n + 1);
    for (let i = 0; i < m; i++) {
      const u = t[2 + 2 * i], v = t[3 + 2 * i];
      to[i] = v; nxt[i] = head[u]; head[u] = i; indeg[v]++;
    }
    const h = new MinHeap();
    for (let v = 1; v <= n; v++) if (!indeg[v]) h.push(v, 0);
    const order: number[] = [];
    while (h.size) {
      const [v] = h.pop();
      order.push(v);
      for (let e = head[v]; e >= 0; e = nxt[e]) if (--indeg[to[e]] === 0) h.push(to[e], 0);
    }
    return order.length === n ? order.join(' ') : '-1';
  },
  editorial: `Run Kahn's algorithm for topological sorting, but keep the **free tasks** (those with no unfinished requirement) in a **min-heap** instead of a plain queue. Always take the smallest free task, then decrease the counters of the tasks that depended on it and push those that became free.

Why is this the lexicographically smallest order? The first element of any valid order must be a free task, and the smallest free task can always be placed first without making the rest impossible (the remaining tasks form a graph in which an order exists iff the whole graph is acyclic). By induction the same holds for each further position.

If the process ends before all $n$ tasks are output, the leftover tasks lie on or behind a cycle, so print $-1$. Time $O((n + m)\\log n)$.

A common mistake is to reverse the graph and run the algorithm backwards with a max-heap; that is a different problem, which minimises the position of small labels rather than comparing the sequences.`,
};

/* ---------------------------------------------------------------- */

export const roadDistances: CodingProblem = {
  id: 'road-distances',
  title: 'Distances From the Capital',
  rating: 1600,
  tags: ['graphs', 'shortest paths', 'dijkstra', 'data structures'],
  timeLimitMs: 2000,
  legend: `A kingdom has $n$ cities and $m$ two-way roads; the $i$-th road joins cities $u_i$ and $v_i$ and takes $w_i$ minutes to travel. The capital is city 1.

For every city find the minimum time needed to travel there from the capital.`,
  inputSpec: `The first line contains $n$ and $m$ ($1 \\le n \\le 2 \\cdot 10^5$, $0 \\le m \\le 2 \\cdot 10^5$). Each of the next $m$ lines contains $u_i$, $v_i$ and $w_i$ ($1 \\le u_i, v_i \\le n$, $u_i \\ne v_i$, $1 \\le w_i \\le 10^9$). There may be several roads between the same two cities.`,
  outputSpec: `Print $n$ integers: the distances to cities $1, 2, \\dots, n$, with $-1$ for cities that cannot be reached.`,
  samples: [
    { input: '5 5\n1 2 4\n1 3 1\n3 2 2\n2 4 5\n3 4 8\n', output: '0 3 1 8 -1\n', note: `City 2 is reached through city 3 in $1 + 2 = 3$ minutes, and city 4 through city 2 in $3 + 5 = 8$. City 5 has no roads.` },
  ],
  generateTests() {
    const r = rng(2805);
    const out: TestCase[] = [T('5 5\n1 2 4\n1 3 1\n3 2 2\n2 4 5\n3 4 8\n'), T('1 0\n'), T('2 0\n')];
    const build = (n: number, m: number, wmax: number, chain: boolean) => {
      const lines: string[] = [];
      if (chain) for (let i = 1; i < n && lines.length < m; i++) lines.push(`${i} ${i + 1} ${r.int(1, wmax)}`);
      while (lines.length < m) { const u = r.int(1, n), v = r.int(1, n); if (u !== v) lines.push(`${u} ${v} ${r.int(1, wmax)}`); }
      return `${n} ${lines.length}\n${lines.join('\n')}\n`;
    };
    out.push(T(build(10, 14, 9, false)));
    const n = 200000;
    out.push(T(build(n, 200000, 1e9, false)));
    out.push(T(build(n, 200000, 1e9, true)));
    out.push(T(build(n, 200000, 3, true)));
    // A long chain of maximal weights: the largest distance is about 2e14.
    out.push(T(`${n} ${n - 1}\n${Array.from({ length: n - 1 }, (_, i) => `${i + 1} ${i + 2} 1000000000`).join('\n')}\n`));
    // Many parallel roads.
    out.push(T(`3 6\n1 2 5\n1 2 3\n1 2 9\n2 3 1\n2 3 1\n1 3 100\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], m = t[1];
    const head = new Int32Array(n + 1).fill(-1), nxt = new Int32Array(2 * m), to = new Int32Array(2 * m), wt = new Float64Array(2 * m);
    let ec = 0;
    for (let i = 0; i < m; i++) {
      const u = t[2 + 3 * i], v = t[3 + 3 * i], w = t[4 + 3 * i];
      to[ec] = v; wt[ec] = w; nxt[ec] = head[u]; head[u] = ec++;
      to[ec] = u; wt[ec] = w; nxt[ec] = head[v]; head[v] = ec++;
    }
    const dist = new Array<number>(n + 1).fill(Infinity);
    dist[1] = 0;
    const h = new MinHeap();
    h.push(0, 1);
    while (h.size) {
      const [d, v] = h.pop();
      if (d > dist[v]) continue;
      for (let e = head[v]; e >= 0; e = nxt[e]) {
        const nd = d + wt[e];
        if (nd < dist[to[e]]) { dist[to[e]] = nd; h.push(nd, to[e]); }
      }
    }
    return dist.slice(1).map((d) => (d === Infinity ? -1 : d)).join(' ');
  },
  editorial: `All travel times are positive, so **Dijkstra's algorithm** applies. Keep a tentative distance for every city and a priority queue of (distance, city) pairs, starting with the capital at distance 0. Repeatedly take the closest unsettled city, and relax its roads: if going through it gives a shorter route to a neighbour, update that neighbour and push it. Entries that are older than the current best distance are skipped when popped (lazy deletion).

Each road is relaxed at most twice and each successful relaxation costs $O(\\log m)$, so the total time is $O((n + m)\\log m)$.

Distances can reach $(n-1)\\cdot 10^9 \\approx 2 \\cdot 10^{14}$, so use 64-bit integers, and start from a "very large" value rather than $2^{31}-1$. Cities never reached keep their initial value and are printed as $-1$.`,
};

/* ---------------------------------------------------------------- */

export const splitMinimax: CodingProblem = {
  id: 'split-minimax',
  title: 'The Fairest Shifts',
  rating: 1700,
  tags: ['binary search', 'greedy', 'arrays'],
  timeLimitMs: 2000,
  legend: `A factory has $n$ jobs in a fixed order, the $i$-th of which takes $a_i$ minutes. They must be split into exactly $k$ consecutive **shifts**, every shift receiving at least one job and jobs keeping their order.

The length of a shift is the sum of its jobs. Minimise the length of the **longest** shift, and print it.`,
  inputSpec: `The first line contains $n$ and $k$ ($1 \\le k \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ integers $a_i$ ($1 \\le a_i \\le 10^9$).`,
  outputSpec: `Print the minimum possible length of the longest shift.`,
  samples: [
    { input: '5 2\n7 2 5 10 8\n', output: '18\n', note: `Split as $[7, 2, 5]$ and $[10, 8]$: the shifts last 14 and 18 minutes.` },
    { input: '4 4\n1 2 3 4\n', output: '4\n' },
  ],
  generateTests() {
    const r = rng(2806);
    const out: TestCase[] = [T('5 2\n7 2 5 10 8\n'), T('4 4\n1 2 3 4\n'), T('1 1\n1000000000\n')];
    out.push(T(`10 3\n${Array.from({ length: 10 }, () => r.int(1, 20)).join(' ')}\n`));
    const n = 200000;
    for (const k of [1, 2, 1000, 99999, n]) out.push(T(`${n} ${k}\n${Array.from({ length: n }, () => r.int(1, 1e9)).join(' ')}\n`));
    out.push(T(`${n} 5\n${Array.from({ length: n }, () => 1e9).join(' ')}\n`));
    out.push(T(`${n} 7\n${Array.from({ length: n }, (_, i) => (i % 1000 === 0 ? 1e9 : 1)).join(' ')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], k = t[1];
    const a = t.slice(2, 2 + n);
    let lo = 0, hi = 0;
    for (const x of a) { lo = Math.max(lo, x); hi += x; }
    const shifts = (cap: number) => {
      let c = 1, cur = 0;
      for (const x of a) { if (cur + x > cap) { c++; cur = 0; } cur += x; }
      return c;
    };
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (shifts(mid) <= k) hi = mid;
      else lo = mid + 1;
    }
    return String(lo);
  },
  editorial: `**Binary search on the answer.** Fix a candidate cap $L$ and ask whether the jobs can be cut into **at most** $k$ shifts of length $\\le L$. A greedy answers it: fill the current shift as long as the next job still fits, then start a new one. This uses the fewest possible shifts for that cap, because ending a shift later never hurts.

The predicate is monotone (a larger cap needs no more shifts), so binary search the smallest feasible $L$ between $\\max a_i$ and $\\sum a_i$. Each check is $O(n)$, and there are about $\\log_2(2 \\cdot 10^{14}) \\approx 48$ rounds.

Why "at most $k$" equals "exactly $k$"? If the greedy uses fewer than $k$ shifts, split some shift further: because $k \\le n$ and all $a_i$ are positive, this keeps every shift non-empty and does not increase the maximum. The sums exceed $2^{31}$, so use 64-bit integers in C++.`,
};

/* ---------------------------------------------------------------- */

export const deleteOne: CodingProblem = {
  id: 'delete-one',
  title: 'One Bad Day',
  rating: 1700,
  tags: ['dp', 'arrays'],
  timeLimitMs: 2000,
  legend: `A shop recorded its profit (possibly negative) on each of $n$ consecutive days. An accountant picks a stretch of consecutive days and may choose to **forget at most one day** inside it, as long as at least one day of the stretch remains. The total profit is the sum of the remaining days.

Find the maximum total profit.`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ integers $a_i$ ($-10^9 \\le a_i \\le 10^9$).`,
  outputSpec: `Print the maximum total profit.`,
  samples: [
    { input: '4\n1 -2 0 3\n', output: '4\n', note: `Take all four days and forget the loss of $-2$: $1 + 0 + 3 = 4$.` },
    { input: '3\n-1 -1 -1\n', output: '-1\n', note: `At least one day must remain.` },
  ],
  generateTests() {
    const r = rng(2807);
    const out: TestCase[] = [T('4\n1 -2 0 3\n'), T('3\n-1 -1 -1\n'), T('1\n-5\n'), T('5\n1 -2 -2 3 -1\n')];
    for (let i = 0; i < 3; i++) out.push(T(`15\n${Array.from({ length: 15 }, () => r.int(-9, 9)).join(' ')}\n`));
    const n = 200000;
    out.push(T(`${n}\n${Array.from({ length: n }, () => r.int(-1e9, 1e9)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => r.int(-1e9, -1)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => 1e9).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => (i % 2 ? -1e9 : 1e9)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => (r.next() < 0.1 ? -1e9 : r.int(0, 1e4))).join(' ')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    // keep[i]: best sum of a stretch ending at i with nothing forgotten; skip[i]: with exactly one forgotten day.
    let keep = t[1], skip = -Infinity, best = t[1];
    for (let i = 1; i < n; i++) {
      const x = t[1 + i];
      skip = Math.max(skip + x, keep); // continue after a forgotten day, or forget day i
      keep = Math.max(keep, 0) + x;
      best = Math.max(best, keep, skip);
    }
    return String(best);
  },
  editorial: `This is the maximum-subarray problem (Kadane) with one extra state. For each day $i$ keep two values for stretches **ending at day $i$**:

- $\\text{keep}_i$: the best total with nothing forgotten. Either start afresh at day $i$ or extend a previous stretch: $\\text{keep}_i = \\max(\\text{keep}_{i-1}, 0) + a_i$.
- $\\text{skip}_i$: the best total with exactly one forgotten day, which must leave a non-empty stretch. Either day $i$ is the forgotten one, so we take $\\text{keep}_{i-1}$ (a non-empty stretch ending at $i - 1$), or the forgotten day came earlier: $\\text{skip}_i = \\max(\\text{skip}_{i-1} + a_i,\\ \\text{keep}_{i-1})$.

The answer is the maximum over all $i$ of $\\text{keep}_i$ and $\\text{skip}_i$. Forgetting a day is only useful when it is negative, but the recurrences take care of that on their own. Time $O(n)$.

The non-empty requirement is the trap: with only negative days, forgetting the single day of a one-day stretch must not be allowed, which is why $\\text{skip}$ looks back at $\\text{keep}_{i-1}$ rather than at 0.`,
};

/* ---------------------------------------------------------------- */

export const palindromeCount: CodingProblem = {
  id: 'palindrome-count',
  title: 'Mirror Words',
  rating: 1800,
  tags: ['strings', 'manacher', 'palindromes'],
  timeLimitMs: 2000,
  legend: `Count the **palindromic substrings** of a string $s$: a substring is a contiguous piece, and it is a palindrome if it reads the same in both directions. Substrings at different positions are counted separately, even if they are equal as strings.`,
  inputSpec: `The only line contains the string $s$ of lowercase letters ($1 \\le |s| \\le 2 \\cdot 10^5$).`,
  outputSpec: `Print the number of palindromic substrings.`,
  samples: [
    { input: 'aaa\n', output: '6\n', note: `Three of length 1, two of length 2 and one of length 3.` },
    { input: 'abac\n', output: '5\n', note: `\`a\`, \`b\`, \`a\`, \`c\` and \`aba\`.` },
  ],
  generateTests() {
    const r = rng(2808);
    const out: TestCase[] = [T('aaa\n'), T('abac\n'), T('z\n')];
    const n = 200000;
    const rand = (len: number, sigma: number) => Array.from({ length: len }, () => String.fromCharCode(97 + r.int(0, sigma - 1))).join('');
    out.push(T(`${rand(40, 2)}\n`));
    out.push(T(`${'a'.repeat(n)}\n`));
    out.push(T(`${'ab'.repeat(n / 2)}\n`));
    out.push(T(`${rand(n, 2)}\n`));
    out.push(T(`${rand(n, 26)}\n`));
    out.push(T(`${'a'.repeat(n / 2 - 1)}b${'a'.repeat(n / 2)}\n`));
    out.push(T(`${'abc'.repeat(Math.floor(n / 3))}\n`));
    return out;
  },
  reference(input) {
    const s = tokens(input)[0];
    const n = s.length;
    // d1[i]: number of odd palindromes centred at i; d2[i]: number of even palindromes centred between i-1 and i.
    const d1 = new Int32Array(n), d2 = new Int32Array(n);
    for (let i = 0, l = 0, r = -1; i < n; i++) {
      let k = i > r ? 1 : Math.min(d1[l + r - i], r - i + 1);
      while (i - k >= 0 && i + k < n && s[i - k] === s[i + k]) k++;
      d1[i] = k;
      if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
    }
    for (let i = 0, l = 0, r = -1; i < n; i++) {
      let k = i > r ? 0 : Math.min(d2[l + r - i + 1], r - i + 1);
      while (i - k - 1 >= 0 && i + k < n && s[i - k - 1] === s[i + k]) k++;
      d2[i] = k;
      if (i + k - 1 > r) { l = i - k; r = i + k - 1; }
    }
    let total = 0;
    for (let i = 0; i < n; i++) total += d1[i] + d2[i];
    return String(total);
  },
  editorial: `Expanding around each of the $2n - 1$ centres takes $O(n^2)$ on strings like \`aaaa…a\`, which is too slow. **Manacher's algorithm** computes, for every centre, the radius of the largest palindrome in linear time in total.

For each centre $i$ let $d_1[i]$ be the number of odd-length palindromes centred at $i$ (equivalently the largest radius, counting the single character) and $d_2[i]$ the number of even-length ones centred just before $i$. Every radius from 1 up to the maximum gives one distinct palindromic substring, so the answer is $\\sum_i (d_1[i] + d_2[i])$.

To get the maximum fast, maintain the rightmost palindrome $[l, r]$ found so far. For a new centre $i$ inside it, the mirror centre $l + r - i$ already has a known radius, and by symmetry that radius (cut at the boundary $r$) is a valid starting value for $i$; only then expand naively. Since $r$ never moves backwards, the expansions are amortised $O(n)$ in total.

The answer reaches $n(n+1)/2 \\approx 2 \\cdot 10^{10}$, so use 64-bit integers.`,
};

export const novProblems: CodingProblem[] = [
  bracketRepair, countInversions, coprimePairs, lexiTopo, roadDistances, splitMinimax, deleteOne, palindromeCount,
];
