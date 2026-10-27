import type { CodingProblem, TestCase } from '../types';
import { rng, tokens } from '../lib/rng';

const T = (input: string): TestCase => ({ input });

/* ---------------------------------------------------------------- */

const rangeXor: CodingProblem = {
  id: 'range-xor',
  title: 'Exclusive Intervals',
  rating: 1200,
  tags: ['bitmasks', 'math'],
  timeLimitMs: 2000,
  legend: `For integers $l \\le r$ define $X(l, r) = l \\oplus (l+1) \\oplus \\dots \\oplus r$, where $\\oplus$ denotes bitwise exclusive or.

You are given $q$ queries. Answer each of them.`,
  inputSpec: `The first line contains $q$ ($1 \\le q \\le 10^5$). Each of the next $q$ lines contains two integers $l$ and $r$ ($1 \\le l \\le r \\le 10^9$).`,
  outputSpec: `For each query print $X(l, r)$ on its own line.`,
  samples: [
    { input: '3\n1 4\n3 3\n2 7\n', output: '4\n3\n1\n', note: `$1 \\oplus 2 \\oplus 3 \\oplus 4 = 4$, and $2 \\oplus 3 \\oplus 4 \\oplus 5 \\oplus 6 \\oplus 7 = 1$.` },
  ],
  generateTests() {
    const r = rng(101);
    const out: TestCase[] = [T('3\n1 4\n3 3\n2 7\n'), T('1\n1000000000 1000000000\n'), T('1\n1 1000000000\n')];
    for (const q of [20, 1000, 100000]) {
      const lines = [String(q)];
      for (let i = 0; i < q; i++) {
        const a = r.int(1, q === 20 ? 50 : 1e9), b = r.int(1, q === 20 ? 50 : 1e9);
        lines.push(`${Math.min(a, b)} ${Math.max(a, b)}`);
      }
      out.push(T(lines.join('\n')));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const f = (n: number) => [n, 1, n + 1, 0][n % 4];
    const res: number[] = [];
    for (let i = 0; i < t[0]; i++) res.push(f(t[2 + 2 * i]) ^ f(t[1 + 2 * i] - 1));
    return res.join('\n');
  },
  editorial: `Let $P(n) = 0 \\oplus 1 \\oplus \\dots \\oplus n$. Since $x \\oplus x = 0$, we have $X(l, r) = P(r) \\oplus P(l - 1)$.

The prefix value has period 4. For every even $m$, $m \\oplus (m+1) = 1$, so pairs cancel in a regular pattern:
$$P(n) = \\begin{cases} n & n \\equiv 0 \\pmod 4 \\\\ 1 & n \\equiv 1 \\\\ n + 1 & n \\equiv 2 \\\\ 0 & n \\equiv 3 \\end{cases}$$

Each query takes $O(1)$ time. The usual trap is iterating from $l$ to $r$, which is $O(10^{14})$ in the worst case.`,
};

/* ---------------------------------------------------------------- */

const divisibleSubarrays: CodingProblem = {
  id: 'divisible-subarrays',
  title: 'Residue Census',
  rating: 1500,
  tags: ['prefix sums', 'hashing', 'combinatorics'],
  timeLimitMs: 2000,
  legend: `You are given an array $a_1, \\dots, a_n$ of integers, possibly negative, and a positive integer $k$.

Count the pairs $(i, j)$ with $1 \\le i \\le j \\le n$ such that $a_i + a_{i+1} + \\dots + a_j$ is divisible by $k$.`,
  inputSpec: `The first line contains $n$ and $k$ ($1 \\le n \\le 2 \\cdot 10^5$, $1 \\le k \\le 10^9$). The second line contains $n$ integers $a_i$ ($|a_i| \\le 10^9$).`,
  outputSpec: `Print a single integer, the number of such subarrays.`,
  samples: [
    { input: '5 3\n1 2 3 -3 4\n', output: '7\n', note: `The valid subarrays are $[1,2]$, $[3]$, $[-3]$, $[3,-3]$, $[1,2,3]$, $[1,2,3,-3]$ and $[2,3,-3,4]$.` },
    { input: '3 1\n-5 0 7\n', output: '6\n' },
  ],
  generateTests() {
    const r = rng(202);
    const out: TestCase[] = [T('5 3\n1 2 3 -3 4\n'), T('3 1\n-5 0 7\n'), T('1 5\n-10\n'), T('4 1000000000\n1000000000 -1000000000 999999999 1\n')];
    const cfgs: [number, number, number][] = [[50, 7, 20], [2000, 13, 1e9], [200000, 1, 1e9], [200000, 999983, 1e9], [200000, 2, 3], [200000, 1e9, 1e9]];
    for (const [n, k, m] of cfgs) {
      const a = Array.from({ length: n }, () => r.int(-m, m));
      out.push(T(`${n} ${k}\n${a.join(' ')}\n`));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], k = t[1];
    const cnt = new Map<number, number>([[0, 1]]);
    let s = 0, ans = 0;
    for (let i = 0; i < n; i++) {
      s = (((s + (t[2 + i] % k)) % k) + k) % k;
      const c = cnt.get(s) ?? 0;
      ans += c;
      cnt.set(s, c + 1);
    }
    return String(ans);
  },
  editorial: `Let $S_0 = 0$ and $S_j = a_1 + \\dots + a_j$. The sum over $[i, j]$ equals $S_j - S_{i-1}$, which is divisible by $k$ exactly when $S_j \\equiv S_{i-1} \\pmod k$.

Scan the array while keeping a hash map from residues to their frequencies among $S_0, \\dots, S_{j-1}$. Each new prefix contributes the current frequency of its own residue. The total is $\\sum_r \\binom{c_r}{2}$.

Two pitfalls deserve attention. First, the remainder operator returns negative values for negative operands in most languages, so normalise with $((x \\bmod k) + k) \\bmod k$. Second, the answer can reach $n(n+1)/2 \\approx 2 \\cdot 10^{10}$, which overflows 32-bit integers.`,
};

/* ---------------------------------------------------------------- */

const noNeighbours: CodingProblem = {
  id: 'no-neighbours',
  title: 'Estranged Neighbours',
  rating: 1000,
  tags: ['constructive algorithms'],
  timeLimitMs: 1000,
  legend: `A permutation $p_1, \\dots, p_n$ of $\\{1, \\dots, n\\}$ is called *estranged* if $|p_i - p_{i+1}| \\ne 1$ for every $1 \\le i < n$; that is, no two consecutive values sit next to each other.

For each given $n$, construct an estranged permutation, or report that none exists.`,
  inputSpec: `The first line contains $t$ ($1 \\le t \\le 100$). Each of the next $t$ lines contains one integer $n$ ($1 \\le n \\le 2 \\cdot 10^5$). The sum of all $n$ does not exceed $2 \\cdot 10^5$.`,
  outputSpec: `For each test case print $n$ space-separated integers forming an estranged permutation, or $-1$ if none exists. Any valid answer is accepted.`,
  samples: [{ input: '3\n1\n3\n5\n', output: '1\n-1\n2 4 1 3 5\n', note: `For $n = 5$, the answer $3\\ 1\\ 4\\ 2\\ 5$ is equally acceptable.` }],
  generateTests() {
    const r = rng(303);
    const out: TestCase[] = [T('3\n1\n3\n5\n'), T('6\n1\n2\n3\n4\n5\n6\n')];
    out.push(T(`20\n${Array.from({ length: 20 }, (_, i) => i + 1).join('\n')}\n`));
    const ns = Array.from({ length: 100 }, () => r.int(1, 1500));
    out.push(T(`100\n${ns.join('\n')}\n`));
    out.push(T('1\n200000\n'));
    out.push(T('2\n99999\n100001\n'));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const res: string[] = [];
    for (let i = 1; i <= t[0]; i++) {
      const n = t[i];
      if (n === 2 || n === 3) { res.push('-1'); continue; }
      const p: number[] = [];
      for (let x = 2; x <= n; x += 2) p.push(x);
      for (let x = 1; x <= n; x += 2) p.push(x);
      res.push(p.join(' '));
    }
    return res.join('\n');
  },
  check(input, output) {
    const t = tokens(input).map(Number);
    const o = tokens(output);
    let p = 0;
    for (let tc = 1; tc <= t[0]; tc++) {
      const n = t[tc];
      const impossible = n === 2 || n === 3;
      if (p >= o.length) return `Test case ${tc}: output ended prematurely.`;
      if (o[p] === '-1') {
        if (!impossible) return `Test case ${tc} (n = ${n}): answered -1, but a solution exists.`;
        p++;
        continue;
      }
      if (impossible) return `Test case ${tc} (n = ${n}): no estranged permutation exists.`;
      const seen = new Uint8Array(n + 1);
      let prev = -10;
      for (let i = 0; i < n; i++, p++) {
        if (p >= o.length) return `Test case ${tc}: expected ${n} numbers.`;
        const v = Number(o[p]);
        if (!Number.isInteger(v) || v < 1 || v > n) return `Test case ${tc}: value "${o[p]}" is out of range.`;
        if (seen[v]) return `Test case ${tc}: value ${v} appears twice.`;
        seen[v] = 1;
        if (Math.abs(v - prev) === 1) return `Test case ${tc}: ${prev} and ${v} are adjacent.`;
        prev = v;
      }
    }
    if (p !== o.length) return 'Extra tokens at the end of the output.';
    return null;
  },
  editorial: `For $n = 1$ the trivial permutation works. For $n = 2$ and $n = 3$ an exhaustive check shows that no estranged permutation exists: with $n = 3$, the value 2 is adjacent in value to both 1 and 3, yet it must have at least one neighbour in position.

For $n \\ge 4$, list the even numbers in increasing order, then the odd numbers in increasing order: $2, 4, \\dots, 1, 3, \\dots$. Within each block consecutive entries differ by 2. At the junction, the last even number $2\\lfloor n/2 \\rfloor \\ge 4$ meets 1, a difference of at least 3.

Because many answers are valid, this problem is judged by a *checker* rather than by comparison with a fixed output, as is customary on Codeforces.`,
};

/* ---------------------------------------------------------------- */

const sumFloors: CodingProblem = {
  id: 'sum-of-floors',
  title: 'Harmonic Staircase',
  rating: 1600,
  tags: ['math', 'number theory', 'sqrt decomposition'],
  timeLimitMs: 2000,
  legend: `For a positive integer $n$, compute
$$D(n) = \\sum_{i=1}^{n} \\left\\lfloor \\frac{n}{i} \\right\\rfloor.$$
Equivalently, $D(n)$ is the total number of divisors of all integers from 1 to $n$.`,
  inputSpec: `The first line contains $t$ ($1 \\le t \\le 10$). Each of the next $t$ lines contains an integer $n$ ($1 \\le n \\le 10^{12}$).`,
  outputSpec: `For each $n$ print $D(n)$. It is guaranteed to fit in a signed 64-bit integer, and indeed below $2^{53}$.`,
  samples: [{ input: '3\n1\n5\n10\n', output: '1\n10\n27\n', note: `$D(5) = 5 + 2 + 1 + 1 + 1 = 10$.` }],
  generateTests() {
    const r = rng(404);
    const out: TestCase[] = [T('3\n1\n5\n10\n')];
    out.push(T(`10\n${Array.from({ length: 10 }, (_, i) => i + 2).join('\n')}\n`));
    out.push(T(`10\n${Array.from({ length: 10 }, () => r.int(1, 1e6)).join('\n')}\n`));
    out.push(T(`10\n${Array.from({ length: 10 }, () => r.int(1e11, 1e12)).join('\n')}\n`));
    out.push(T('3\n1000000000000\n999999999999\n999999000001\n'));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const res: number[] = [];
    for (let k = 1; k <= t[0]; k++) {
      const n = t[k];
      let s = 0;
      for (let i = 1; i <= n; ) {
        const q = Math.floor(n / i);
        const j = Math.floor(n / q);
        s += q * (j - i + 1);
        i = j + 1;
      }
      res.push(s);
    }
    return res.join('\n');
  },
  editorial: `A direct loop requires $10^{12}$ iterations per query, which is far too slow. The key observation is that $\\lfloor n/i \\rfloor$ takes at most $2\\sqrt{n}$ distinct values: for $i \\le \\sqrt n$ there are at most $\\sqrt n$ indices, and for $i > \\sqrt n$ the quotient is below $\\sqrt n$.

For a block starting at $i$ with $q = \\lfloor n/i \\rfloor$, the largest index sharing this quotient is $j = \\lfloor n/q \\rfloor$. Add $q \\cdot (j - i + 1)$ and continue from $j + 1$. Each query costs $O(\\sqrt n) \\approx 2 \\cdot 10^6$ steps.

An elegant alternative uses the symmetry of the lattice-point count under $y = n/x$, with $s = \\lfloor \\sqrt n \\rfloor$:
$$D(n) = 2\\sum_{i=1}^{s} \\lfloor n/i \\rfloor - s^2.$$`,
};

/* ---------------------------------------------------------------- */

const routers: CodingProblem = {
  id: 'spread-the-routers',
  title: 'Interference-Free Corridor',
  rating: 1400,
  tags: ['binary search', 'greedy', 'sorting'],
  timeLimitMs: 2000,
  legend: `A long corridor has $n$ candidate mounting points at distinct integer coordinates $x_1, \\dots, x_n$. You must install exactly $k$ wireless routers at $k$ distinct mounting points. To limit interference, you wish to make the **smallest distance** between any two installed routers as large as possible.

Find this maximum possible minimum distance.`,
  inputSpec: `The first line contains $n$ and $k$ ($2 \\le k \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ distinct integers $x_i$ ($0 \\le x_i \\le 10^9$), not necessarily sorted.`,
  outputSpec: `Print a single integer, the largest achievable minimum pairwise distance.`,
  samples: [{ input: '5 3\n1 2 8 4 9\n', output: '3\n', note: `Install at $1, 4, 8$ (or $1, 4, 9$).` }],
  generateTests() {
    const r = rng(505);
    const out: TestCase[] = [T('5 3\n1 2 8 4 9\n'), T('2 2\n0 1000000000\n'), T('4 4\n10 3 7 1\n')];
    for (const [n, k, m] of [[30, 5, 100], [1000, 17, 1e9], [200000, 2, 1e9], [200000, 1000, 1e9], [200000, 200000, 1e9], [200000, 54321, 1e9]]) {
      const set = new Set<number>();
      while (set.size < n) set.add(r.int(0, m === 100 ? 100 : m));
      const xs = [...set];
      out.push(T(`${n} ${k}\n${xs.join(' ')}\n`));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], k = t[1];
    const x = Float64Array.from(t.slice(2, 2 + n)).sort();
    const ok = (d: number) => {
      let c = 1, last = x[0];
      for (let i = 1; i < n; i++) if (x[i] - last >= d) { c++; last = x[i]; if (c >= k) return true; }
      return c >= k;
    };
    let lo = 1, hi = x[n - 1] - x[0];
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (ok(mid)) lo = mid; else hi = mid - 1;
    }
    return String(lo);
  },
  editorial: `The feasibility predicate "a minimum distance of at least $d$ is achievable" is monotone in $d$: if $d$ is achievable, so is every smaller value. This invites **binary search on the answer**.

To test a fixed $d$, sort the coordinates and place routers greedily: put one at the leftmost point, then repeatedly at the first point at distance at least $d$ from the last router. An exchange argument shows that greedy placement maximises the number of routers placed, so $d$ is feasible if and only if greedy places at least $k$.

Total complexity: $O(n \\log n + n \\log X)$ where $X = 10^9$. A frequent mistake is to forget that the input is unsorted. In JavaScript, \`Array.prototype.sort\` without a comparator sorts lexicographically.`,
};

/* ---------------------------------------------------------------- */

const craters: CodingProblem = {
  id: 'grid-craters',
  title: 'Lunar Rover',
  rating: 1300,
  tags: ['dp', 'combinatorics'],
  timeLimitMs: 2000,
  legend: `A rover traverses an $h \\times w$ grid from the top-left cell $(1, 1)$ to the bottom-right cell $(h, w)$, moving only **right** or **down**. Some cells contain craters (\`#\`) that the rover cannot enter; the others are free (\`.\`).

Count the distinct routes modulo $10^9 + 7$.`,
  inputSpec: `The first line contains $h$ and $w$ ($1 \\le h, w \\le 1000$). Each of the next $h$ lines contains a string of length $w$ over \`.\` and \`#\`.`,
  outputSpec: `Print the number of routes modulo $10^9 + 7$. If the start or the destination is a crater, the answer is 0.`,
  samples: [
    { input: '3 4\n....\n.#..\n...#\n', output: '0\n' },
    { input: '3 3\n...\n.#.\n...\n', output: '2\n' },
  ],
  generateTests() {
    const r = rng(606);
    const out: TestCase[] = [T('3 4\n....\n.#..\n...#\n'), T('3 3\n...\n.#.\n...\n'), T('1 1\n.\n'), T('1 1\n#\n'), T('2 2\n.#\n#.\n')];
    for (const [h, w, p] of [[10, 10, 0.1], [1000, 1000, 0], [1000, 1000, 0.05], [1000, 1000, 0.3], [1, 1000, 0], [1000, 7, 0.02]]) {
      const rows: string[] = [];
      for (let i = 0; i < h; i++) {
        let s = '';
        for (let j = 0; j < w; j++) s += (i + j > 0 && i + j < h + w - 2 && r.next() < p) ? '#' : '.';
        rows.push(s);
      }
      out.push(T(`${h} ${w}\n${rows.join('\n')}\n`));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input);
    const h = Number(t[0]), w = Number(t[1]);
    const M = 1_000_000_007;
    const dp = new Int32Array(w);
    for (let i = 0; i < h; i++) {
      const row = t[2 + i];
      for (let j = 0; j < w; j++) {
        if (row[j] === '#') { dp[j] = 0; continue; }
        if (i === 0 && j === 0) { dp[j] = 1; continue; }
        const v = dp[j] + (j > 0 ? dp[j - 1] : 0);
        dp[j] = v >= M ? v - M : v;
      }
    }
    return String(dp[w - 1]);
  },
  editorial: `Let $f(i, j)$ be the number of routes reaching $(i, j)$. A free cell is entered either from above or from the left, so
$$f(i, j) = f(i-1, j) + f(i, j-1),$$
with $f(i, j) = 0$ on craters and $f(1, 1) = 1$ if the start is free.

The table has $10^6$ entries, and a single rolling row of length $w$ suffices. Since both summands are below $10^9 + 7$, their sum fits in 32 bits before reduction.

Without obstacles the answer is $\\binom{h + w - 2}{h - 1}$. With few obstacles, an inclusion–exclusion over craters sorted by position gives an $O(c^2)$ solution, which is the intended approach for the well-known variant with $h, w \\le 10^5$.`,
};

/* ---------------------------------------------------------------- */

const window: CodingProblem = {
  id: 'k-distinct-window',
  title: 'Limited Vocabulary',
  rating: 1300,
  tags: ['two pointers', 'strings'],
  timeLimitMs: 2000,
  legend: `A palaeographer studies a manuscript transcribed as a string $s$ of lowercase Latin letters. She believes that a scribe with a vocabulary of at most $k$ distinct letters wrote one contiguous passage.

Find the length of the longest substring of $s$ that contains **at most $k$ distinct letters**.`,
  inputSpec: `The first line contains $k$ ($1 \\le k \\le 26$). The second line contains $s$ ($1 \\le |s| \\le 2 \\cdot 10^5$).`,
  outputSpec: `Print a single integer, the maximum length.`,
  samples: [
    { input: '2\neceba\n', output: '3\n', note: 'The substring "ece" uses only two letters.' },
    { input: '1\naaabbbbcc\n', output: '4\n' },
  ],
  generateTests() {
    const r = rng(707);
    const out: TestCase[] = [T('2\neceba\n'), T('1\naaabbbbcc\n'), T('26\nz\n'), T('3\nabcabcabc\n')];
    const gen = (n: number, alpha: number) => Array.from({ length: n }, () => String.fromCharCode(97 + r.int(0, alpha - 1))).join('');
    for (const [k, n, a] of [[2, 40, 4], [3, 200000, 26], [5, 200000, 6], [1, 200000, 2], [26, 200000, 26], [10, 200000, 12]]) out.push(T(`${k}\n${gen(n, a)}\n`));
    // Long blocks of letters favour long windows.
    let s = '';
    while (s.length < 200000) s += String.fromCharCode(97 + r.int(0, 25)).repeat(r.int(1, 3000));
    out.push(T(`4\n${s.slice(0, 200000)}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input);
    const k = Number(t[0]), s = t[1];
    const cnt = new Int32Array(26);
    let distinct = 0, best = 0, l = 0;
    for (let r = 0; r < s.length; r++) {
      if (cnt[s.charCodeAt(r) - 97]++ === 0) distinct++;
      while (distinct > k) if (--cnt[s.charCodeAt(l++) - 97] === 0) distinct--;
      best = Math.max(best, r - l + 1);
    }
    return String(best);
  },
  editorial: `If a window contains at most $k$ distinct letters, so does every window inside it. This monotonicity justifies the **two-pointer** technique.

Advance the right end one character at a time, maintaining letter counts and the number of distinct letters. Whenever the count of distinct letters exceeds $k$, advance the left end until the constraint holds again. Each pointer moves at most $|s|$ times, so the algorithm runs in $O(|s|)$ time with $O(\\Sigma)$ memory.

Trying every substring takes $O(|s|^2)$ time, which amounts to about $4 \\cdot 10^{10}$ operations here and is hopeless within the time limit.`,
};

/* ---------------------------------------------------------------- */

const pairSums: CodingProblem = {
  id: 'pair-sums',
  title: 'Matching Pairs',
  rating: 1100,
  tags: ['hashing', 'counting'],
  timeLimitMs: 2000,
  legend: `You are given an array $a_1, \\dots, a_n$ and an integer $S$. Count the pairs of indices $i < j$ such that $a_i + a_j = S$.`,
  inputSpec: `The first line contains $n$ and $S$ ($1 \\le n \\le 2 \\cdot 10^5$, $|S| \\le 2 \\cdot 10^9$). The second line contains $n$ integers $a_i$ ($|a_i| \\le 10^9$).`,
  outputSpec: `Print a single integer, the number of such pairs.`,
  samples: [
    { input: '5 6\n1 5 3 3 3\n', output: '4\n', note: `The pairs are $(1,2)$, $(3,4)$, $(3,5)$ and $(4,5)$.` },
    { input: '3 0\n0 0 0\n', output: '3\n' },
  ],
  generateTests() {
    const r = rng(1101);
    const out: TestCase[] = [T('5 6\n1 5 3 3 3\n'), T('3 0\n0 0 0\n'), T('1 2\n1\n'), T('2 2000000000\n1000000000 1000000000\n')];
    for (const [n, m, s] of [[30, 6, 7], [2000, 100, 0], [200000, 1e9, 1], [200000, 3, 4], [200000, 1, 0], [200000, 1e9, 123456789]]) {
      const a = Array.from({ length: n }, () => r.int(-m, m));
      out.push(T(`${n} ${s}\n${a.join(' ')}\n`));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], s = t[1];
    const cnt = new Map<number, number>();
    let ans = 0;
    for (let i = 0; i < n; i++) {
      const x = t[2 + i];
      ans += cnt.get(s - x) ?? 0;
      cnt.set(x, (cnt.get(x) ?? 0) + 1);
    }
    return String(ans);
  },
  editorial: `Scan the array from left to right while keeping a hash map from values to the number of times they have appeared so far. For the current element $x$, every earlier element equal to $S - x$ forms a valid pair with it, so add \`cnt[S - x]\` to the answer and then record $x$.

The running time is $O(n)$ expected. Note that the answer may reach $\\binom{n}{2} \\approx 2 \\cdot 10^{10}$, which needs a 64-bit integer. The quadratic double loop does about $2 \\cdot 10^{10}$ iterations and is too slow.`,
};

/* ---------------------------------------------------------------- */

const longestRise: CodingProblem = {
  id: 'longest-rise',
  title: 'Climbing Sequence',
  rating: 1600,
  tags: ['binary search', 'dp'],
  timeLimitMs: 2000,
  legend: `Given an array $a_1, \\dots, a_n$, find the length of its **longest strictly increasing subsequence**: the largest $k$ for which there are indices $i_1 < i_2 < \\dots < i_k$ with $a_{i_1} < a_{i_2} < \\dots < a_{i_k}$.`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ integers $a_i$ ($|a_i| \\le 10^9$).`,
  outputSpec: `Print a single integer.`,
  samples: [
    { input: '6\n5 2 8 6 3 7\n', output: '3\n', note: `One optimal subsequence is $2, 3, 7$.` },
    { input: '4\n4 4 4 4\n', output: '1\n' },
  ],
  generateTests() {
    const r = rng(1202);
    const out: TestCase[] = [T('6\n5 2 8 6 3 7\n'), T('4\n4 4 4 4\n'), T('1\n-1000000000\n')];
    const n = 200000;
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => i - 100000).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => 100000 - i).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => r.int(-1e9, 1e9)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, () => r.int(-5, 5)).join(' ')}\n`));
    out.push(T(`${n}\n${Array.from({ length: n }, (_, i) => (i % 2 ? i : -i)).join(' ')}\n`));
    out.push(T(`40\n${Array.from({ length: 40 }, () => r.int(-20, 20)).join(' ')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    const tails: number[] = [];
    for (let i = 0; i < n; i++) {
      const x = t[1 + i];
      let lo = 0, hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid] < x) lo = mid + 1; else hi = mid;
      }
      tails[lo] = x;
    }
    return String(tails.length);
  },
  editorial: `The $O(n^2)$ dynamic programme $f_i = 1 + \\max_{j < i,\\, a_j < a_i} f_j$ is too slow for $n = 2 \\cdot 10^5$.

Maintain an array $\\text{tails}$, where $\\text{tails}[k]$ is the smallest possible last element of an increasing subsequence of length $k + 1$ among the elements processed so far. This array is strictly increasing. For a new element $x$, find the first position with $\\text{tails}[k] \\ge x$ by binary search and overwrite it with $x$ (or append $x$ if there is no such position). The answer is the final length of $\\text{tails}$.

Using the first position with $\\text{tails}[k] \\ge x$ is what makes the subsequence *strictly* increasing: equal elements replace each other instead of extending the sequence. The complexity is $O(n \\log n)$.`,
};

/* ---------------------------------------------------------------- */

const fewestCoins: CodingProblem = {
  id: 'fewest-coins',
  title: 'Exact Change',
  rating: 1300,
  tags: ['dp'],
  timeLimitMs: 2000,
  legend: `A vending machine has an unlimited supply of coins of $n$ denominations $c_1, \\dots, c_n$. Using as few coins as possible, pay **exactly** $X$ units. If it is impossible, report so.`,
  inputSpec: `The first line contains $n$ and $X$ ($1 \\le n \\le 100$, $1 \\le X \\le 10^5$). The second line contains $n$ distinct integers $c_i$ ($1 \\le c_i \\le 10^5$).`,
  outputSpec: `Print the minimum number of coins, or $-1$ if $X$ cannot be paid exactly.`,
  samples: [
    { input: '3 11\n1 5 6\n', output: '2\n', note: `$11 = 5 + 6$. Greedy would take $6 + 5$ here, but for $X = 10$ it fails: $6 + 1 + 1 + 1 + 1$ against $5 + 5$.` },
    { input: '2 7\n2 4\n', output: '-1\n' },
  ],
  generateTests() {
    const r = rng(1303);
    const out: TestCase[] = [T('3 11\n1 5 6\n'), T('2 7\n2 4\n'), T('1 100000\n1\n'), T('3 100000\n99999 2 3\n')];
    for (const [n, x, m] of [[5, 40, 12], [100, 100000, 100000], [100, 99999, 1000], [100, 100000, 50000], [20, 77777, 300]]) {
      const set = new Set<number>();
      while (set.size < n) set.add(r.int(1, m));
      out.push(T(`${n} ${x}\n${[...set].join(' ')}\n`));
    }
    const even = [2, 4, 6, 8, 10, 12, 100, 1000, 5000].join(' ');
    out.push(T(`9 99999\n${even}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], x = t[1];
    const INF = 1e9;
    const dp = new Int32Array(x + 1).fill(INF);
    dp[0] = 0;
    for (let v = 1; v <= x; v++)
      for (let i = 0; i < n; i++) {
        const c = t[2 + i];
        if (c <= v && dp[v - c] + 1 < dp[v]) dp[v] = dp[v - c] + 1;
      }
    return String(dp[x] >= INF ? -1 : dp[x]);
  },
  editorial: `Greedy choice of the largest coin fails in general, as the sample note shows. Let $f(v)$ be the minimum number of coins summing to $v$, with $f(0) = 0$. Considering the last coin used,
$$f(v) = 1 + \\min_{c_i \\le v} f(v - c_i),$$
and unreachable values stay at infinity. The table has $X + 1$ entries and each costs $O(n)$, so the total is $O(nX) \\le 10^7$ operations.`,
};

/* ---------------------------------------------------------------- */

const mazeRunner: CodingProblem = {
  id: 'maze-runner',
  title: 'Shortest Way Out',
  rating: 1300,
  tags: ['bfs', 'graphs', 'grids'],
  timeLimitMs: 2000,
  legend: `A maze is an $h \\times w$ grid whose cells are either free (\`.\`) or walls (\`#\`). In one move you step to a free cell sharing a side with your current cell. Find the minimum number of moves from the top-left cell to the bottom-right cell.`,
  inputSpec: `The first line contains $h$ and $w$ ($1 \\le h, w \\le 1000$). Each of the next $h$ lines contains a string of $w$ characters. The top-left and bottom-right cells are always free.`,
  outputSpec: `Print the minimum number of moves, or $-1$ if the exit is unreachable.`,
  samples: [
    { input: '3 3\n..#\n.#.\n...\n', output: '4\n' },
    { input: '2 2\n.#\n#.\n', output: '-1\n' },
  ],
  generateTests() {
    const r = rng(1404);
    const out: TestCase[] = [T('3 3\n..#\n.#.\n...\n'), T('2 2\n.#\n#.\n'), T('1 1\n.\n')];
    const grid = (h: number, w: number, p: number) => {
      const g = Array.from({ length: h }, () => Array.from({ length: w }, () => (r.next() < p ? '#' : '.')));
      g[0][0] = '.'; g[h - 1][w - 1] = '.';
      return g;
    };
    for (const [h, w, p] of [[6, 6, 0.3], [1000, 1000, 0], [1000, 1000, 0.25], [1000, 1000, 0.4], [1, 1000, 0], [1000, 1, 0.001]]) {
      out.push(T(`${h} ${w}\n${grid(h, w, p).map((row) => row.join('')).join('\n')}\n`));
    }
    // A serpentine corridor forces a path of about h*w/2 moves.
    const h = 999, w = 999;
    const g = Array.from({ length: h }, (_, i) => Array.from({ length: w }, () => (i % 2 === 0 ? '.' : '#')));
    for (let i = 1; i < h; i += 2) g[i][((i - 1) / 2) % 2 === 0 ? w - 1 : 0] = '.';
    out.push(T(`${h} ${w}\n${g.map((row) => row.join('')).join('\n')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input);
    const h = Number(t[0]), w = Number(t[1]);
    const dist = new Int32Array(h * w).fill(-1);
    const queue = new Int32Array(h * w);
    let qh = 0, qt = 0;
    dist[0] = 0;
    queue[qt++] = 0;
    while (qh < qt) {
      const v = queue[qh++];
      const i = (v / w) | 0, j = v % w;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= h || b >= w || t[2 + a][b] === '#' || dist[a * w + b] >= 0) continue;
        dist[a * w + b] = dist[v] + 1;
        queue[qt++] = a * w + b;
      }
    }
    return String(dist[h * w - 1]);
  },
  editorial: `All moves cost one unit, so **breadth-first search** from the start visits cells in non-decreasing distance order, and the first time a cell is reached is via a shortest route. Each cell is enqueued at most once and has four neighbours, giving $O(hw)$ time.

Use an iterative queue (an array with a head index). A recursive depth-first search would overflow the call stack on a $1000 \\times 1000$ serpentine corridor, and it does not find shortest paths anyway.`,
};

/* ---------------------------------------------------------------- */

const cheapestNetwork: CodingProblem = {
  id: 'cheapest-network',
  title: 'Cheapest Backbone',
  rating: 1600,
  tags: ['graphs', 'dsu', 'greedy', 'sortings'],
  timeLimitMs: 2000,
  legend: `A telecom company wants to connect $n$ cities. There are $m$ possible cables; the $i$-th joins cities $u_i$ and $v_i$ at cost $w_i$. Choose a set of cables of minimum total cost so that every pair of cities is connected, directly or indirectly.`,
  inputSpec: `The first line contains $n$ and $m$ ($1 \\le n \\le 2 \\cdot 10^5$, $0 \\le m \\le 2 \\cdot 10^5$). Each of the next $m$ lines contains $u_i$, $v_i$, $w_i$ ($1 \\le u_i, v_i \\le n$, $1 \\le w_i \\le 10^9$). Loops and parallel cables may occur.`,
  outputSpec: `Print the minimum total cost, or $-1$ if the cities cannot all be connected.`,
  samples: [
    { input: '4 5\n1 2 1\n2 3 2\n3 4 3\n1 4 4\n1 3 5\n', output: '6\n' },
    { input: '3 1\n1 2 7\n', output: '-1\n' },
  ],
  generateTests() {
    const r = rng(1505);
    const out: TestCase[] = [T('4 5\n1 2 1\n2 3 2\n3 4 3\n1 4 4\n1 3 5\n'), T('3 1\n1 2 7\n'), T('1 0\n')];
    const gen = (n: number, m: number, wmax: number, tree: boolean) => {
      const e: string[] = [];
      if (tree) for (let v = 2; v <= n && e.length < m; v++) e.push(`${r.int(1, v - 1)} ${v} ${r.int(1, wmax)}`);
      while (e.length < m) e.push(`${r.int(1, n)} ${r.int(1, n)} ${r.int(1, wmax)}`);
      return `${n} ${m}\n${e.join('\n')}\n`;
    };
    out.push(T(gen(8, 15, 20, true)), T(gen(1000, 3000, 1e9, false)), T(gen(200000, 200000, 1e9, true)),
      T(gen(100000, 200000, 1e9, true)), T(gen(200000, 199999, 1e9, true)), T(gen(200000, 200000, 1e9, false)), T(gen(50000, 200000, 3, true)));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], m = t[1];
    const idx = Array.from({ length: m }, (_, i) => i).sort((a, b) => t[4 + 3 * a] - t[4 + 3 * b]);
    const p = new Int32Array(n + 1);
    for (let i = 0; i <= n; i++) p[i] = i;
    const find = (x: number) => {
      while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; }
      return x;
    };
    let total = 0, used = 0;
    for (const e of idx) {
      const a = find(t[2 + 3 * e]), b = find(t[3 + 3 * e]);
      if (a === b) continue;
      p[a] = b;
      total += t[4 + 3 * e];
      used++;
    }
    return String(used === n - 1 ? total : -1);
  },
  editorial: `This is the **minimum spanning tree** problem. By the cut property, the cheapest cable leaving any set of cities belongs to some optimal solution, which justifies **Kruskal's algorithm**: sort the cables by cost and accept a cable exactly when it joins two different components, tracked with a disjoint-set union (DSU) with path compression.

If fewer than $n - 1$ cables are accepted, the graph is disconnected. The cost can be as large as $2 \\cdot 10^5 \\cdot 10^9 = 2 \\cdot 10^{14}$, so use 64-bit integers. The complexity is $O(m \\log m)$.`,
};

/* ---------------------------------------------------------------- */

const nextTaller: CodingProblem = {
  id: 'next-taller',
  title: 'The Taller Neighbour',
  rating: 1400,
  tags: ['stack', 'data structures'],
  timeLimitMs: 2000,
  legend: `$n$ buildings stand in a row, the $i$-th with height $h_i$. For every building $i$, find the nearest building **to its right** that is strictly taller, and report how many positions away it is. If there is none, report $0$.`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ integers $h_i$ ($1 \\le h_i \\le 10^9$).`,
  outputSpec: `Print $n$ space-separated integers $d_1, \\dots, d_n$, where $d_i = j - i$ for the smallest $j > i$ with $h_j > h_i$, and $d_i = 0$ if no such $j$ exists.`,
  samples: [{ input: '6\n3 1 4 1 5 9\n', output: '2 1 2 1 1 0\n' }],
  generateTests() {
    const r = rng(1606);
    const out: TestCase[] = [T('6\n3 1 4 1 5 9\n'), T('1\n7\n'), T('5\n5 5 5 5 5\n')];
    const n = 200000;
    const fmt = (a: number[]) => T(`${a.length}\n${a.join(' ')}\n`);
    out.push(fmt(Array.from({ length: n }, (_, i) => i + 1)), fmt(Array.from({ length: n }, (_, i) => n - i)),
      fmt(Array.from({ length: n }, () => r.int(1, 1e9))), fmt(Array.from({ length: n }, () => r.int(1, 3))),
      fmt(Array.from({ length: 30 }, () => r.int(1, 10))));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    const res = new Array<number>(n).fill(0);
    const st: number[] = [];
    for (let i = 0; i < n; i++) {
      while (st.length && t[1 + st[st.length - 1]] < t[1 + i]) {
        const j = st.pop()!;
        res[j] = i - j;
      }
      st.push(i);
    }
    return res.join(' ');
  },
  editorial: `Process the buildings from left to right while keeping a stack of indices whose answer is still unknown; their heights are non-increasing from bottom to top. When building $i$ arrives, pop every stack element that is strictly shorter than $h_i$: building $i$ is their nearest taller neighbour. Then push $i$.

Each index is pushed and popped at most once, so the algorithm runs in $O(n)$. The brute-force scan to the right costs $O(n^2)$ on a decreasing sequence.`,
};

/* ---------------------------------------------------------------- */

const MP = 5_000_000;
const primeCensus: CodingProblem = {
  id: 'prime-census',
  title: 'Prime Census',
  rating: 1200,
  tags: ['number theory', 'sieve', 'prefix sums'],
  timeLimitMs: 2000,
  legend: `For each of $q$ queries $(l, r)$, count the prime numbers in the segment $[l, r]$.`,
  inputSpec: `The first line contains $q$ ($1 \\le q \\le 10^5$). Each of the next $q$ lines contains two integers $l$ and $r$ ($1 \\le l \\le r \\le 5 \\cdot 10^6$).`,
  outputSpec: `For each query print the number of primes in $[l, r]$ on its own line.`,
  samples: [{ input: '3\n1 10\n14 16\n2 2\n', output: '4\n0\n1\n' }],
  generateTests() {
    const r = rng(1707);
    const out: TestCase[] = [T('3\n1 10\n14 16\n2 2\n'), T(`2\n1 ${MP}\n${MP} ${MP}\n`)];
    for (const [q, m] of [[50, 100], [100000, MP], [100000, 1000]]) {
      const lines = [String(q)];
      for (let i = 0; i < q; i++) {
        const a = r.int(1, m), b = r.int(1, m);
        lines.push(`${Math.min(a, b)} ${Math.max(a, b)}`);
      }
      out.push(T(lines.join('\n')));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    let hi = 1;
    for (let i = 0; i < t[0]; i++) hi = Math.max(hi, t[2 + 2 * i]);
    const comp = new Uint8Array(hi + 1);
    const pre = new Int32Array(hi + 1);
    for (let i = 2; i * i <= hi; i++) if (!comp[i]) for (let j = i * i; j <= hi; j += i) comp[j] = 1;
    for (let i = 2; i <= hi; i++) pre[i] = pre[i - 1] + (comp[i] ? 0 : 1);
    const res: number[] = [];
    for (let i = 0; i < t[0]; i++) res.push(pre[t[2 + 2 * i]] - pre[t[1 + 2 * i] - 1]);
    return res.join('\n');
  },
  editorial: `Testing every number in a query by trial division is far too slow: $10^5$ queries of length $5 \\cdot 10^6$ is $5 \\cdot 10^{11}$ divisibility tests before even considering the cost of each.

Run the **sieve of Eratosthenes** once up to $5 \\cdot 10^6$ in $O(N \\log \\log N)$ time, then build prefix counts $\\pi(x)$ of primes up to $x$. A query is answered in $O(1)$ as $\\pi(r) - \\pi(l - 1)$. Remember that 1 is not prime.`,
};

/* ---------------------------------------------------------------- */

const MOD = 1_000_000_007;
const mulmod = (a: number, b: number) => {
  const ah = Math.floor(a / 65536), al = a & 65535;
  return (((ah * b) % MOD) * 65536 + al * b) % MOD;
};
const powmod = (b: number, e: number) => {
  let r = 1;
  b %= MOD;
  while (e > 0) {
    if (e & 1) r = mulmod(r, b);
    b = mulmod(b, b);
    e = Math.floor(e / 2);
  }
  return r;
};

const chooseMod: CodingProblem = {
  id: 'choose-mod',
  title: 'Committees by the Million',
  rating: 1500,
  tags: ['combinatorics', 'number theory', 'modular arithmetic'],
  timeLimitMs: 2000,
  legend: `For each of $q$ queries $(n, k)$, compute the number of ways to choose a committee of $k$ people from $n$, that is $\\binom{n}{k}$, modulo $p = 10^9 + 7$.`,
  inputSpec: `The first line contains $q$ ($1 \\le q \\le 10^5$). Each of the next $q$ lines contains $n$ and $k$ ($0 \\le k \\le n \\le 10^6$).`,
  outputSpec: `For each query print $\\binom{n}{k} \\bmod p$ on its own line.`,
  samples: [{ input: '4\n5 2\n10 0\n10 10\n1000000 500000\n', output: '10\n1\n1\n996692777\n' }],
  generateTests() {
    const r = rng(1808);
    const out: TestCase[] = [T('4\n5 2\n10 0\n10 10\n1000000 500000\n')];
    for (const [q, m] of [[40, 12], [100000, 1e6], [100000, 2000]]) {
      const lines = [String(q)];
      for (let i = 0; i < q; i++) {
        const n = r.int(0, m);
        lines.push(`${n} ${r.int(0, n)}`);
      }
      out.push(T(lines.join('\n')));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    let hi = 1;
    for (let i = 0; i < t[0]; i++) hi = Math.max(hi, t[1 + 2 * i]);
    const f = new Array<number>(hi + 1);
    f[0] = 1;
    for (let i = 1; i <= hi; i++) f[i] = mulmod(f[i - 1], i);
    const inv = new Array<number>(hi + 1);
    inv[hi] = powmod(f[hi], MOD - 2);
    for (let i = hi; i > 0; i--) inv[i - 1] = mulmod(inv[i], i);
    const res: number[] = [];
    for (let i = 0; i < t[0]; i++) {
      const n = t[1 + 2 * i], k = t[2 + 2 * i];
      res.push(mulmod(mulmod(f[n], inv[k]), inv[n - k]));
    }
    return res.join('\n');
  },
  editorial: `Pascal's triangle is far too large for $n$ up to $10^6$, and the product formula $\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!}$ requires division, which is not directly available modulo $p$. Because $p$ is prime, every nonzero residue $x$ has an inverse $x^{-1} \\equiv x^{p-2}$ by Fermat's little theorem.

Precompute $i! \\bmod p$ for $i \\le N$ and a single modular inverse of $N!$ by fast exponentiation, then obtain all inverse factorials downwards using $(i-1)!^{-1} = i!^{-1} \\cdot i$. Each query is then two multiplications: $\\binom{n}{k} = n! \\cdot (k!)^{-1} \\cdot ((n-k)!)^{-1}$.

Products of two residues reach about $10^{18}$, which fits in a signed 64-bit integer but exceeds the exact range of JavaScript numbers ($2^{53}$); there use \`BigInt\` or split one factor into 16-bit halves. Total time $O(N + q)$.`,
};

/* ---------------------------------------------------------------- */

const lootBag: CodingProblem = {
  id: 'loot-bag',
  title: 'The Heavy Satchel',
  rating: 1400,
  tags: ['dp', 'knapsack'],
  timeLimitMs: 2000,
  legend: `A thief can carry at most $W$ kilograms. There are $n$ items; the $i$-th weighs $w_i$ kilograms and is worth $v_i$. Each item can be taken at most once. Find the maximum total value that fits in the bag.`,
  inputSpec: `The first line contains $n$ and $W$ ($1 \\le n \\le 200$, $1 \\le W \\le 20000$). Each of the next $n$ lines contains $w_i$ and $v_i$ ($1 \\le w_i \\le W$, $1 \\le v_i \\le 10^9$).`,
  outputSpec: `Print the maximum total value.`,
  samples: [{ input: '3 50\n10 60\n20 100\n30 120\n', output: '220\n', note: `Take the items of weights 20 and 30.` }],
  generateTests() {
    const r = rng(1909);
    const out: TestCase[] = [T('3 50\n10 60\n20 100\n30 120\n'), T('1 1\n1 1000000000\n'), T('2 5\n5 3\n5 4\n')];
    for (const [n, w, m, v] of [[8, 30, 15, 50], [200, 20000, 20000, 1e9], [200, 20000, 300, 1e9], [200, 20000, 5000, 1e9], [200, 100, 100, 1e9]]) {
      const lines = [`${n} ${w}`];
      for (let i = 0; i < n; i++) lines.push(`${r.int(1, m)} ${r.int(1, v)}`);
      out.push(T(lines.join('\n')));
    }
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], W = t[1];
    const dp = new Float64Array(W + 1);
    for (let i = 0; i < n; i++) {
      const w = t[2 + 2 * i], v = t[3 + 2 * i];
      for (let c = W; c >= w; c--) if (dp[c - w] + v > dp[c]) dp[c] = dp[c - w] + v;
    }
    return String(dp[W]);
  },
  editorial: `Let $dp[c]$ be the best value achievable with capacity $c$ using the items considered so far. Adding an item of weight $w$ and value $v$ updates $dp[c] \\gets \\max(dp[c],\\ dp[c - w] + v)$.

Iterate $c$ **downwards** from $W$ to $w$ so that each item is used at most once: the value $dp[c - w]$ read at that moment still belongs to the state before the current item. Iterating upwards would allow unlimited copies of each item (the unbounded knapsack). The complexity is $O(nW) \\le 4 \\cdot 10^6$. Totals reach $2 \\cdot 10^{11}$, so 64-bit values are needed.`,
};

/* ---------------------------------------------------------------- */

const wordMorph: CodingProblem = {
  id: 'word-morph',
  title: 'Spelling Reform',
  rating: 1700,
  tags: ['dp', 'strings'],
  timeLimitMs: 2000,
  legend: `The **edit distance** between two strings is the minimum number of operations needed to turn one into the other, where an operation inserts a character, deletes a character, or replaces a character with another one.

Compute the edit distance between strings $a$ and $b$.`,
  inputSpec: `The first line contains $a$ and the second line contains $b$ ($1 \\le |a|, |b| \\le 2000$), both consisting of lowercase Latin letters.`,
  outputSpec: `Print a single integer.`,
  samples: [{ input: 'kitten\nsitting\n', output: '3\n' }, { input: 'abc\nabc\n', output: '0\n' }],
  generateTests() {
    const r = rng(2010);
    const gen = (n: number, alpha: number) => Array.from({ length: n }, () => String.fromCharCode(97 + r.int(0, alpha - 1))).join('');
    const out: TestCase[] = [T('kitten\nsitting\n'), T('abc\nabc\n'), T('a\nb\n')];
    for (const [n, m, a] of [[10, 12, 3], [2000, 2000, 26], [2000, 2000, 2], [2000, 1, 26], [1, 2000, 26]]) out.push(T(`${gen(n, a)}\n${gen(m, a)}\n`));
    const base = gen(2000, 4);
    out.push(T(`${base}\n${base.slice(100) + gen(100, 4)}\n`));
    return out;
  },
  reference(input) {
    const [a, b] = tokens(input);
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = new Array<number>(b.length + 1);
      cur[0] = i;
      for (let j = 1; j <= b.length; j++)
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return String(prev[b.length]);
  },
  editorial: `Let $d(i, j)$ be the edit distance between the first $i$ characters of $a$ and the first $j$ characters of $b$. Looking at the last characters, the optimal edit sequence either deletes $a_i$, inserts $b_j$, or aligns $a_i$ with $b_j$ (free if equal, one replacement otherwise):
$$d(i, j) = \\min\\bigl(d(i-1, j) + 1,\\ d(i, j-1) + 1,\\ d(i-1, j-1) + [a_i \\ne b_j]\\bigr),$$
with $d(i, 0) = i$ and $d(0, j) = j$.

The table has $4 \\cdot 10^6$ entries; since row $i$ depends only on row $i - 1$, two rows are enough. Naive recursion without memoisation is exponential.`,
};

/* ---------------------------------------------------------------- */

const friendCircles: CodingProblem = {
  id: 'friend-circles',
  title: 'Growing Circles',
  rating: 1300,
  tags: ['dsu', 'graphs'],
  timeLimitMs: 2000,
  legend: `A social network has $n$ users and no friendships at first. Then $m$ friendships form one after another. A *circle* is a maximal group of users connected through chains of friendships.

After each new friendship, report the size of the **largest circle**.`,
  inputSpec: `The first line contains $n$ and $m$ ($1 \\le n, m \\le 2 \\cdot 10^5$). Each of the next $m$ lines contains two users $a_i$ and $b_i$ ($1 \\le a_i, b_i \\le n$), who become friends. The same pair may appear more than once, and $a_i = b_i$ is possible.`,
  outputSpec: `Print $m$ lines: the size of the largest circle after each friendship.`,
  samples: [{ input: '5 4\n1 2\n3 4\n2 3\n5 5\n', output: '2\n2\n4\n4\n' }],
  generateTests() {
    const r = rng(2111);
    const out: TestCase[] = [T('5 4\n1 2\n3 4\n2 3\n5 5\n'), T('1 1\n1 1\n')];
    const gen = (n: number, m: number) => `${n} ${m}\n${Array.from({ length: m }, () => `${r.int(1, n)} ${r.int(1, n)}`).join('\n')}\n`;
    out.push(T(gen(10, 15)), T(gen(200000, 200000)), T(gen(200000, 100000)), T(gen(1000, 200000)));
    out.push(T(`200000 199999\n${Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join('\n')}\n`));
    out.push(T(`200000 199999\n${Array.from({ length: 199999 }, (_, i) => `${200000 - i} ${199999 - i}`).join('\n')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], m = t[1];
    const p = new Int32Array(n + 1), size = new Int32Array(n + 1).fill(1);
    for (let i = 0; i <= n; i++) p[i] = i;
    const find = (x: number) => {
      while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; }
      return x;
    };
    let best = 1;
    const res: number[] = [];
    for (let i = 0; i < m; i++) {
      let a = find(t[2 + 2 * i]), b = find(t[3 + 2 * i]);
      if (a !== b) {
        if (size[a] < size[b]) [a, b] = [b, a];
        p[b] = a;
        size[a] += size[b];
        best = Math.max(best, size[a]);
      }
      res.push(best);
    }
    return res.join('\n');
  },
  editorial: `Circles only ever merge, and the largest circle never shrinks. A **disjoint-set union** (DSU) supports exactly this: \`find\` returns the representative of a user's circle, and \`union\` merges two circles. Keep the size of each set at its representative and a running maximum.

With path compression and union by size every operation takes nearly constant amortised time ($O(\\alpha(n))$), so the whole input is processed in about $O((n + m)\\,\\alpha(n))$. Recomputing the circles from scratch after each friendship would cost $O(m(n + m))$.`,
};

/* ---------------------------------------------------------------- */

const circularFortune: CodingProblem = {
  id: 'circular-fortune',
  title: 'The Carousel Ledger',
  rating: 1500,
  tags: ['dp', 'greedy', 'arrays'],
  timeLimitMs: 2000,
  legend: `A carousel has $n$ seats arranged in a circle, and seat $i$ holds a bag containing $a_i$ coins (negative values mean debt). Choose a **non-empty** run of consecutive seats, where the run may wrap around from seat $n$ to seat $1$, and collect all its bags. What is the maximum possible total?`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). The second line contains $n$ integers $a_i$ ($|a_i| \\le 10^9$).`,
  outputSpec: `Print the maximum total of a non-empty circular run (it may consist of all $n$ seats).`,
  samples: [
    { input: '5\n8 -8 9 -9 10\n', output: '19\n', note: `Take seats $5, 1, 2, 3$: $10 + 8 - 8 + 9 = 19$.` },
    { input: '3\n-3 -2 -5\n', output: '-2\n' },
  ],
  generateTests() {
    const r = rng(2212);
    const out: TestCase[] = [T('5\n8 -8 9 -9 10\n'), T('3\n-3 -2 -5\n'), T('1\n-7\n')];
    const n = 200000;
    const fmt = (a: number[]) => T(`${a.length}\n${a.join(' ')}\n`);
    out.push(fmt(Array.from({ length: 12 }, () => r.int(-9, 9))), fmt(Array.from({ length: n }, () => r.int(-1e9, 1e9))),
      fmt(Array.from({ length: n }, () => 1e9)), fmt(Array.from({ length: n }, () => -1e9)),
      fmt(Array.from({ length: n }, (_, i) => (i < 1000 || i >= n - 1000 ? 1e9 : -1e9))),
      fmt(Array.from({ length: n }, () => r.int(-1000, 1050))));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    let total = 0, curMax = 0, curMin = 0, best = -Infinity, worst = Infinity;
    for (let i = 0; i < n; i++) {
      const x = t[1 + i];
      total += x;
      curMax = Math.max(curMax + x, x);
      best = Math.max(best, curMax);
      curMin = Math.min(curMin + x, x);
      worst = Math.min(worst, curMin);
    }
    return String(best < 0 ? best : Math.max(best, total - worst));
  },
  editorial: `A circular run is either an ordinary run (Kadane's algorithm, $O(n)$) or a run that wraps around. The complement of a wrapping run is an ordinary, non-empty run in the middle, so a wrapping run's sum equals $\\text{total} - (\\text{sum of a middle run})$. It is largest when the middle run has the **minimum** sum, which Kadane's algorithm also finds.

The answer is $\\max(\\text{maxRun},\\ \\text{total} - \\text{minRun})$, with one exception: if every element is negative, the minimum run is the whole array and the formula would select an empty run. In that case the answer is simply the maximum single element, i.e. $\\text{maxRun}$. In general, when $\\text{maxRun} < 0$ return it directly.`,
};

/* ---------------------------------------------------------------- */

const paintCoverage: CodingProblem = {
  id: 'paint-coverage',
  title: 'Fresh Paint',
  rating: 1200,
  tags: ['sortings', 'greedy', 'intervals'],
  timeLimitMs: 2000,
  legend: `A fence is painted by $n$ painters, each covering a segment $[l_i, r_i]$ of the number line (with $l_i < r_i$). Segments may overlap. What is the **total length** of the fence that has been painted at least once?`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). Each of the next $n$ lines contains $l_i$ and $r_i$ ($0 \\le l_i < r_i \\le 10^9$).`,
  outputSpec: `Print the total length of the union of the segments.`,
  samples: [{ input: '3\n1 5\n4 8\n10 12\n', output: '9\n' }, { input: '2\n0 10\n2 3\n', output: '10\n' }],
  generateTests() {
    const r = rng(2313);
    const out: TestCase[] = [T('3\n1 5\n4 8\n10 12\n'), T('2\n0 10\n2 3\n'), T('1\n0 1000000000\n')];
    const gen = (n: number, m: number, maxLen: number) => {
      const lines = [String(n)];
      for (let i = 0; i < n; i++) {
        const l = r.int(0, m - 1), len = r.int(1, Math.min(maxLen, m - l));
        lines.push(`${l} ${l + len}`);
      }
      return T(lines.join('\n'));
    };
    out.push(gen(10, 30, 8), gen(200000, 1e9, 1e9), gen(200000, 1e9, 3000), gen(200000, 1e9, 100000), gen(200000, 400000, 3));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => t[1 + 2 * a] - t[1 + 2 * b]);
    let total = 0, curL = -1, curR = -1;
    for (const i of idx) {
      const l = t[1 + 2 * i], r = t[2 + 2 * i];
      if (l > curR) {
        if (curR > curL) total += curR - curL;
        curL = l;
        curR = r;
      } else if (r > curR) curR = r;
    }
    if (curR > curL) total += curR - curL;
    return String(total);
  },
  editorial: `Sort the segments by left endpoint and sweep from left to right, maintaining the current merged block $[L, R]$. A new segment that starts after $R$ closes the block (add $R - L$ to the answer) and opens a new one; a segment that starts inside the block extends $R$ if it reaches further. The final block is added at the end.

Sorting dominates, so the algorithm runs in $O(n \\log n)$. Marking each unit cell of the fence individually would need up to $10^9$ cells and is too slow and memory-hungry.`,
};

/* ---------------------------------------------------------------- */

const shortestCover: CodingProblem = {
  id: 'shortest-cover',
  title: 'The Shortest Sufficient Stretch',
  rating: 1200,
  tags: ['two pointers', 'arrays'],
  timeLimitMs: 2000,
  legend: `A river is gauged at $n$ consecutive points, with positive rainfall readings $a_1, \\dots, a_n$. Find the length of the shortest contiguous stretch of readings whose sum is **at least** $S$.`,
  inputSpec: `The first line contains $n$ and $S$ ($1 \\le n \\le 2 \\cdot 10^5$, $1 \\le S \\le 10^{14}$). The second line contains $n$ integers $a_i$ ($1 \\le a_i \\le 10^9$).`,
  outputSpec: `Print the minimum length, or $-1$ if even the whole sequence is not enough.`,
  samples: [{ input: '6 15\n2 3 1 2 10 4\n', output: '3\n', note: `The stretch $10, 4$ sums to only 14, but $2, 10, 4$ sums to 16.` }],
  generateTests() {
    const r = rng(2414);
    const out: TestCase[] = [T('6 15\n2 3 1 2 10 4\n'), T('3 100\n1 2 3\n'), T('1 5\n5\n')];
    const n = 200000;
    out.push(T(`12 20\n${Array.from({ length: 12 }, () => r.int(1, 9)).join(' ')}\n`));
    out.push(T(`${n} 100000000000000\n${Array.from({ length: n }, () => 1e9).join(' ')}\n`));
    out.push(T(`${n} 99999999999999\n${Array.from({ length: n }, () => 1e9).join(' ')}\n`));
    out.push(T(`${n} 50000000000\n${Array.from({ length: n }, () => r.int(1, 1e9)).join(' ')}\n`));
    out.push(T(`${n} 1000\n${Array.from({ length: n }, () => r.int(1, 3)).join(' ')}\n`));
    out.push(T(`${n} 1\n${Array.from({ length: n }, () => r.int(1, 3)).join(' ')}\n`));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], S = t[1];
    let best = Infinity, sum = 0, l = 0;
    for (let rgt = 0; rgt < n; rgt++) {
      sum += t[2 + rgt];
      while (sum - t[2 + l] >= S) sum -= t[2 + l++];
      if (sum >= S) best = Math.min(best, rgt - l + 1);
    }
    return String(best === Infinity ? -1 : best);
  },
  editorial: `All readings are positive, so extending a stretch increases its sum and shrinking it decreases it. This monotonicity makes **two pointers** work: for each right end, drop elements from the left while the sum stays at least $S$, then record the stretch length if the sum is at least $S$.

Each pointer advances at most $n$ times, so the running time is $O(n)$. The sums reach $2 \\cdot 10^{14}$, beyond 32-bit integers (but still exact in JavaScript numbers). With negative values the monotonicity breaks and a different approach (prefix sums with a monotone deque) is required.`,
};

export const codingProblems: CodingProblem[] = [
  rangeXor, noNeighbours, divisibleSubarrays, craters, routers, window, sumFloors,
  pairSums, longestRise, fewestCoins, mazeRunner, cheapestNetwork, nextTaller, primeCensus,
  chooseMod, lootBag, wordMorph, friendCircles, circularFortune, paintCoverage, shortestCover,
];
