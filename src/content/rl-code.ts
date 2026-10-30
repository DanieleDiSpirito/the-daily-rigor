import type { CodingProblem, TestCase } from '../types';
import { rng, tokens } from '../lib/rng';

/* Reinforcement-learning week: seven algorithmic problems built around the objects an RL course uses. */

const T = (input: string): TestCase => ({ input });

const P = 998244353n;
const md = (x: bigint) => ((x % P) + P) % P;
const mpow = (b: bigint, e: bigint) => {
  let r = 1n;
  b = md(b);
  while (e > 0n) {
    if (e & 1n) r = (r * b) % P;
    b = (b * b) % P;
    e >>= 1n;
  }
  return r;
};
const inv = (x: bigint) => mpow(x, P - 2n);

/* ---------------------------------------------------------------- 1 */

const returnsToGo: CodingProblem = {
  id: 'returns-to-go',
  title: 'Returns to Go',
  rating: 1100,
  tags: ['math', 'dp', 'modular arithmetic'],
  timeLimitMs: 2000,
  legend: `An agent interacts with an environment for $n$ steps and receives the rewards $r_1, \\dots, r_n$. The steps are split into **episodes**: $d_i = 1$ means that the episode ends right after step $i$ (and $d_n = 1$ always). With a discount factor $\\gamma = a/b$, the **return** from step $i$ is

$$G_i = r_i + \\gamma\\,(1 - d_i)\\,G_{i+1}, \\qquad G_{n+1} = 0,$$

that is, the discounted sum of the rewards from step $i$ until the end of its episode.

Compute $G_1, \\dots, G_n$ modulo $998\\,244\\,353$, where $\\gamma$ is interpreted as $a \\cdot b^{-1} \\bmod 998\\,244\\,353$.`,
  inputSpec: `The first line contains $n$, $a$ and $b$ ($1 \\le n \\le 2 \\cdot 10^5$, $0 \\le a \\le b \\le 10^6$, $b \\ge 1$). The second line contains $r_1, \\dots, r_n$ ($|r_i| \\le 10^9$). The third line contains $d_1, \\dots, d_n$ ($d_i \\in \\{0, 1\\}$, $d_n = 1$).`,
  outputSpec: `Print $n$ integers: $G_i \\bmod 998\\,244\\,353$, each in $[0, 998\\,244\\,352]$.`,
  samples: [
    { input: '5 1 2\n1 2 3 4 5\n0 0 1 0 1\n', output: '249561091 499122180 3 499122183 5\n', note: `With $\\gamma = 1/2$ the true returns are $11/4,\\ 7/2,\\ 3,\\ 13/2,\\ 5$. The first episode is steps 1–3, the second is steps 4–5.` },
    { input: '3 1 1\n-1 -1 -1\n0 0 1\n', output: '998244350 998244351 998244352\n', note: `Undiscounted: $-3, -2, -1$.` },
  ],
  generateTests() {
    const r = rng(7001);
    const out: TestCase[] = [T('5 1 2\n1 2 3 4 5\n0 0 1 0 1\n'), T('3 1 1\n-1 -1 -1\n0 0 1\n'), T('1 0 5\n7\n1\n'), T('1 3 3\n-1000000000\n1\n')];
    const make = (n: number, a: number, b: number, doneP: number, big: boolean) => {
      const rs = Array.from({ length: n }, () => (big ? (r.next() < 0.5 ? 1e9 : -1e9) : r.int(-9, 9)));
      const ds = Array.from({ length: n }, (_, i) => (i === n - 1 || r.next() < doneP ? 1 : 0));
      return T(`${n} ${a} ${b}\n${rs.join(' ')}\n${ds.join(' ')}\n`);
    };
    out.push(make(12, 2, 3, 0.2, false), make(1000, 999999, 1000000, 0.01, true), make(200000, 1, 1, 0, true), make(200000, 0, 7, 0.3, true));
    out.push(make(200000, 999983, 1000000, 0.001, true), make(200000, 1, 1000000, 0.05, false), make(200000, 500000, 1000000, 0, true));
    return out;
  },
  reference(input) {
    const t = tokens(input);
    const n = Number(t[0]);
    const g = (BigInt(t[1]) * inv(BigInt(t[2]))) % P;
    const rs = t.slice(3, 3 + n), ds = t.slice(3 + n, 3 + 2 * n);
    const out = new Array<string>(n);
    let next = 0n;
    for (let i = n - 1; i >= 0; i--) {
      next = md(BigInt(rs[i]) + (ds[i] === '1' ? 0n : g * next));
      out[i] = String(next);
    }
    return out.join(' ');
  },
  editorial: `Work **backwards**: the definition is already a recurrence, $G_i = r_i + \\gamma G_{i+1}$ unless the episode ends at $i$, in which case $G_i = r_i$. Starting from $G_{n+1} = 0$ and sweeping from $i = n$ down to $1$ gives all returns in $O(n)$.

Everything is done modulo $998\\,244\\,353$. The discount $\\gamma = a/b$ becomes $a \\cdot b^{-1}$, where the inverse comes from Fermat's little theorem, $b^{-1} = b^{p-2} \\bmod p$ (valid since $1 \\le b < p$). Negative rewards need a final \`((x % p) + p) % p\`. Products of two residues reach $10^{18}$, so use 64-bit integers (\`long long\`).

This backward sweep is exactly how a policy-gradient implementation computes "reward-to-go" for a batch of trajectories.`,
};

/* ---------------------------------------------------------------- 2 */

const qTrace: CodingProblem = {
  id: 'q-table-rewind',
  title: 'Q-Table Rewind',
  rating: 1200,
  tags: ['implementation', 'simulation'],
  timeLimitMs: 2000,
  legend: `A tabular **Q-learning** agent has $S$ states and $A$ actions, and a table $Q[s][a]$ that starts at 0. You are given the log of $T$ transitions $(s_i, a_i, r_i, s'_i)$, in the order they happened. Replay the log. For each transition set

$$Q[s][a] \\leftarrow Q[s][a] + \\operatorname{trunc}\\!\\left(\\frac{r + \\max_{b} Q[s'][b] - Q[s][a]}{2}\\right),$$

that is, learning rate $\\alpha = 1/2$, discount $\\gamma = 1$, and the division by 2 **rounds towards zero** (as \`/\` does in C++ for integers). Every state is treated as non-terminal.

Print the final table.`,
  inputSpec: `The first line contains $S$, $A$ and $T$ ($1 \\le S, A \\le 100$, $1 \\le T \\le 2 \\cdot 10^5$). Each of the next $T$ lines contains $s_i$, $a_i$, $r_i$, $s'_i$ ($0 \\le s_i, s'_i < S$, $0 \\le a_i < A$, $|r_i| \\le 1000$).`,
  outputSpec: `Print $S$ lines with $A$ integers each: the final values $Q[s][0], \\dots, Q[s][A-1]$.`,
  samples: [
    { input: '2 2 5\n0 0 10 1\n1 1 4 0\n0 0 2 0\n0 0 0 0\n1 0 -7 1\n', output: '6 0\n-1 4\n', note: `After the first update $Q[0][0] = 5$; then $Q[1][1] = \\operatorname{trunc}(9/2) = 4$; then $Q[0][0] = 5 + \\operatorname{trunc}(2/2) = 6$. In the last transition $(-7 + 4 - 0)/2 = -1.5$ is truncated to $-1$.` },
  ],
  generateTests() {
    const r = rng(7002);
    const out: TestCase[] = [T('2 2 5\n0 0 10 1\n1 1 4 0\n0 0 2 0\n0 0 0 0\n1 0 -7 1\n'), T('1 1 3\n0 0 1000 0\n0 0 1000 0\n0 0 -1000 0\n')];
    const make = (S: number, A: number, Tn: number, rmax: number, bias: number) => {
      const lines = [`${S} ${A} ${Tn}`];
      for (let i = 0; i < Tn; i++) lines.push(`${r.int(0, S - 1)} ${r.int(0, A - 1)} ${r.int(-rmax + bias, rmax)} ${r.int(0, S - 1)}`);
      return T(lines.join('\n') + '\n');
    };
    out.push(make(3, 3, 30, 9, 0), make(5, 4, 1000, 1000, 0), make(100, 100, 200000, 1000, 0), make(2, 100, 200000, 1000, 1000), make(100, 2, 200000, 5, 0), make(1, 1, 200000, 1000, 1000), make(10, 10, 200000, 1000, -999));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const S = t[0], A = t[1], Tn = t[2];
    const q = Array.from({ length: S }, () => new Array<number>(A).fill(0));
    for (let i = 0; i < Tn; i++) {
      const s = t[3 + 4 * i], a = t[4 + 4 * i], rw = t[5 + 4 * i], s2 = t[6 + 4 * i];
      q[s][a] += Math.trunc((rw + Math.max(...q[s2]) - q[s][a]) / 2);
    }
    return q.map((row) => row.join(' ')).join('\n');
  },
  editorial: `This is a pure simulation: one pass over the log, $O(T \\cdot A)$ in total because each update needs $\\max_b Q[s'][b]$, which is a scan over $A \\le 100$ entries. (Maintaining a per-state maximum is possible but not needed.)

The traps are in the arithmetic. The update uses the table **before** the change, in particular $\\max_b Q[s'][b]$ is read before $Q[s][a]$ is written, which matters when $s' = s$. The division by two truncates towards zero, so $-3/2 = -1$ and not $-2$; in C++ \`(x) / 2\` already does this, whereas in Python \`//\` floors. Since $\\gamma = 1$ and the targets are not bounded by a terminal state, values can grow linearly with $T$, up to about $2 \\cdot 10^8$, which still fits in 32 bits, but a \`long long\` is harmless.

In real Q-learning the target is $r + \\gamma \\max_b Q(s', b)$ and the estimate moves by a fraction $\\alpha$ of the temporal-difference error towards it. Here $\\alpha = 1/2$ keeps everything in integers.`,
};

/* ---------------------------------------------------------------- 3 */

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  while (b) [a, b] = [b, a % b];
  return a;
};

const firstVisit: CodingProblem = {
  id: 'first-visit-values',
  title: 'First Visit',
  rating: 1300,
  tags: ['implementation', 'math'],
  timeLimitMs: 2000,
  legend: `You are evaluating a policy by **first-visit Monte Carlo**. You have $E$ episodes. In an episode of length $L$ the agent is in the states $s_1, \\dots, s_L$ and receives the reward $r_t$ right after leaving $s_t$. With no discounting, the return from step $t$ is $G_t = r_t + r_{t+1} + \\dots + r_L$.

The estimate of $V(s)$ is the average, over the episodes in which $s$ appears, of the return $G_t$ at the **first** step $t$ of that episode with $s_t = s$. (Later visits in the same episode are ignored.)

Print the estimate of every state, as an exact fraction.`,
  inputSpec: `The first line contains $N$ (the number of states, $1 \\le N \\le 10^5$) and $E$ ($1 \\le E \\le 10^5$). Each of the next $E$ lines describes one episode: it starts with $L$, followed by $L$ pairs $s_t, r_t$ ($0 \\le s_t < N$, $|r_t| \\le 1000$). The sum of all $L$ is at most $2 \\cdot 10^5$.`,
  outputSpec: `Print $N$ lines. Line $s$ contains the estimate of $V(s)$ as an irreducible fraction \`p/q\` with $q > 0$ (an integer is written as \`p/1\`, zero as \`0/1\`), or a single \`-\` if state $s$ never appears.`,
  samples: [
    { input: '4 2\n4 0 1 1 2 0 3 2 4\n2 0 -4 1 1\n', output: '7/2\n5/1\n4/1\n-\n', note: `Episode 1 has returns $10, 9, 7, 4$; state 0 is first visited at the first step ($G=10$), state 1 at the second ($G=9$), state 2 at the fourth ($G=4$). Episode 2 has returns $-3, 1$. So $V(0) = (10-3)/2$, $V(1) = (9+1)/2$, $V(2) = 4$, and state 3 is never visited.` },
  ],
  generateTests() {
    const r = rng(7003);
    const out: TestCase[] = [T('4 2\n4 0 1 1 2 0 3 2 4\n2 0 -4 1 1\n'), T('1 1\n1 0 0\n'), T('3 1\n3 2 -5 2 -5 2 -5\n')];
    const make = (N: number, E: number, totalLen: number, rmax: number, usedStates: number) => {
      const lines = [`${N} ${E}`];
      const lens = new Array<number>(E).fill(1);
      for (let k = E; k < totalLen; k++) lens[r.int(0, E - 1)]++;
      for (let e = 0; e < E; e++) {
        const parts = [String(lens[e])];
        for (let i = 0; i < lens[e]; i++) parts.push(String(r.int(0, usedStates - 1)), String(r.int(-rmax, rmax)));
        lines.push(parts.join(' '));
      }
      return T(lines.join('\n') + '\n');
    };
    out.push(make(5, 6, 40, 9, 5), make(10, 3, 200, 1000, 8), make(100000, 100000, 200000, 1000, 100000), make(3, 2, 200000, 1000, 3), make(100000, 1, 200000, 1000, 100000), make(50, 1000, 200000, 1000, 50));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const N = t[0], E = t[1];
    const sum = new Array<number>(N).fill(0), cnt = new Array<number>(N).fill(0);
    let p = 2;
    for (let e = 0; e < E; e++) {
      const L = t[p++];
      const st = new Array<number>(L), rw = new Array<number>(L);
      for (let i = 0; i < L; i++) { st[i] = t[p++]; rw[i] = t[p++]; }
      const G = new Array<number>(L);
      let acc = 0;
      for (let i = L - 1; i >= 0; i--) { acc += rw[i]; G[i] = acc; }
      const seen = new Set<number>();
      for (let i = 0; i < L; i++) if (!seen.has(st[i])) { seen.add(st[i]); sum[st[i]] += G[i]; cnt[st[i]]++; }
    }
    return Array.from({ length: N }, (_, s) => {
      if (!cnt[s]) return '-';
      const g = gcd(sum[s], cnt[s]) || 1;
      return `${sum[s] / g}/${cnt[s] / g}`;
    }).join('\n');
  },
  editorial: `For each episode compute all returns with one backward sweep, $G_t = r_t + G_{t+1}$, and then scan forwards: the first time a state shows up in this episode, add its return to a running sum for that state and increment its counter. A per-episode \`seen\` set (or a "last episode that touched this state" array, which avoids clearing) enforces the first-visit rule. Total time is $O(\\sum L)$.

At the end, $V(s) = \\text{sum}_s / \\text{count}_s$. Reduce the fraction by $g = \\gcd(|\\text{sum}_s|, \\text{count}_s)$ and make sure the denominator is positive (it always is here, since the count is positive). Note that $\\gcd(0, c) = c$, which turns $0/c$ into $0/1$.

The difference with the **every-visit** variant is only that it would also add the returns of later visits. Both converge to $V^\\pi$, but first-visit estimates are unbiased.`,
};

/* ---------------------------------------------------------------- 4 */

const corridor: CodingProblem = {
  id: 'corridor-policy-eval',
  title: 'Corridor Policy Evaluation',
  rating: 1600,
  tags: ['math', 'probabilities', 'modular arithmetic'],
  timeLimitMs: 2000,
  legend: `A fixed policy moves an agent along a corridor of states $0, 1, \\dots, n$, where state $n$ is the goal. From state $0$ the agent always moves to state $1$. From a state $i$ with $1 \\le i \\le n-1$ it moves to $i+1$ with probability $p_i = a_i / b_i$ and to $i - 1$ with probability $1 - p_i$. Every move takes one time step.

Compute the **expected number of steps** to reach state $n$ starting from state $0$ (this is the value of state 0 in the Bellman equation $E_i = 1 + \\sum_j P(i, j)\\,E_j$, $E_n = 0$). The answer is a rational number; print it modulo $998\\,244\\,353$.`,
  inputSpec: `The first line contains $n$ ($1 \\le n \\le 2 \\cdot 10^5$). Each of the next $n - 1$ lines contains $a_i$ and $b_i$ for $i = 1, \\dots, n-1$ ($1 \\le a_i \\le b_i \\le 10^6$).`,
  outputSpec: `Print the expected number of steps, as $x \\cdot y^{-1} \\bmod 998\\,244\\,353$ for the fraction $x/y$ in lowest terms. It is guaranteed that $y$ is not divisible by $998\\,244\\,353$.`,
  samples: [
    { input: '3\n1 2\n1 2\n', output: '9\n', note: `A fair walk with a reflecting wall needs $n^2 = 9$ steps on average.` },
    { input: '3\n1 1\n1 3\n', output: '7\n', note: `State 1 always moves right; state 2 moves right with probability $1/3$. The first-passage times are $1, 1, 5$.` },
  ],
  generateTests() {
    const r = rng(7004);
    const out: TestCase[] = [T('3\n1 2\n1 2\n'), T('3\n1 1\n1 3\n'), T('1\n'), T('2\n1 1\n')];
    const make = (n: number, kind: 'rand' | 'one' | 'low' | 'half') => {
      const lines = [String(n)];
      for (let i = 1; i < n; i++) {
        if (kind === 'one') lines.push('1 1');
        else if (kind === 'half') lines.push('500000 1000000');
        else if (kind === 'low') lines.push(`${r.int(1, 3)} ${r.int(900000, 1000000)}`);
        else { const b = r.int(1, 1000000); lines.push(`${r.int(1, b)} ${b}`); }
      }
      return T(lines.join('\n') + '\n');
    };
    out.push(make(10, 'rand'), make(50, 'half'), make(200000, 'rand'), make(200000, 'one'), make(200000, 'half'), make(200000, 'low'), make(7, 'low'));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0];
    let delta = 1n, total = 1n; // delta_i: expected time to go from i to i+1 for the first time
    for (let i = 1; i < n; i++) {
      const a = BigInt(t[2 * i - 1]), b = BigInt(t[2 * i]);
      // delta_i = (1 + q_i * delta_{i-1}) / p_i, with p_i = a/b and q_i = (b-a)/b
      delta = md((b + (b - a) * delta) % P * inv(a));
      total = (total + delta) % P;
    }
    return String(total);
  },
  editorial: `Let $\\Delta_i$ be the expected time to go from $i$ for the first time to $i + 1$. Then $E_0 = \\Delta_0 + \\Delta_1 + \\dots + \\Delta_{n-1}$, and $\\Delta_0 = 1$.

For $1 \\le i \\le n - 1$, look at the first step from $i$. With probability $p_i$ we arrive at $i+1$ after one step. Otherwise we are at $i - 1$ after one step, and we must first return to $i$, which takes $\\Delta_{i-1}$ on average, and then start over from $i$:

$$\\Delta_i = 1 + (1 - p_i)\\,(\\Delta_{i-1} + \\Delta_i) \\quad\\Longrightarrow\\quad \\Delta_i = \\frac{1 + (1 - p_i)\\,\\Delta_{i-1}}{p_i}.$$

This is a linear-time recurrence, and the only division is by $p_i = a_i / b_i$, that is a multiplication by $b_i \\cdot a_i^{-1}$, which exists because $1 \\le a_i < 998\\,244\\,353$. In the sample with $p = 1/2$ we get $\\Delta = 1, 3, 5$, in general $\\Delta_i = 2i + 1$, hence $E_0 = n^2$.

The alternative, solving the $n \\times n$ tridiagonal linear system by Gaussian elimination, is also $O(n)$ with the Thomas algorithm, but it can divide by a pivot that is $0$ modulo the prime for no good reason. The first-passage form only ever divides by the $a_i$.`,
};

/* ---------------------------------------------------------------- 5 */

const sumTree: CodingProblem = {
  id: 'replay-sum-tree',
  title: 'Prioritised Replay',
  rating: 1600,
  tags: ['data structures', 'binary search', 'fenwick tree'],
  timeLimitMs: 2000,
  legend: `A replay buffer stores $n$ transitions, the $i$-th with a non-negative integer **priority** $p_i$. To sample, the agent draws an integer $v$ uniformly in $[0, \\sum p_i)$ and takes the transition $i$ such that

$$p_1 + \\dots + p_{i-1} \\;\\le\\; v \\;<\\; p_1 + \\dots + p_i,$$

so that transition $i$ is chosen with probability proportional to $p_i$. Priorities change over time. Process $q$ operations of two kinds:

- \`1 i x\`: set $p_i := x$;
- \`2 v\`: print the index $i$ selected by the draw $v$.`,
  inputSpec: `The first line contains $n$ and $q$ ($1 \\le n, q \\le 2 \\cdot 10^5$). The second line contains $p_1, \\dots, p_n$ ($0 \\le p_i \\le 10^9$). Each of the next $q$ lines is an operation: \`1 i x\` ($1 \\le i \\le n$, $0 \\le x \\le 10^9$) or \`2 v\`. In every query $0 \\le v < \\sum p_i$ at that moment, which is guaranteed to be positive.`,
  outputSpec: `For every operation of type 2, print the selected index on its own line.`,
  samples: [
    { input: '4 5\n3 0 5 2\n2 0\n2 2\n2 3\n1 3 0\n2 3\n', output: '1\n1\n3\n4\n', note: `The prefix sums are $3, 3, 8, 10$. The draw $v = 3$ falls in $[3, 8)$, which belongs to index 3 (index 2 has priority 0 and is never chosen). After setting $p_3 = 0$ the prefix sums are $3, 3, 3, 5$, so $v = 3$ selects index 4.` },
  ],
  generateTests() {
    const r = rng(7005);
    const out: TestCase[] = [T('4 5\n3 0 5 2\n2 0\n2 2\n2 3\n1 3 0\n2 3\n'), T('1 2\n1\n2 0\n1 1 5\n')];
    const make = (n: number, q: number, pmax: number, updateP: number, zeroP: number) => {
      const p: number[] = Array.from({ length: n }, () => (r.next() < zeroP ? 0 : r.int(0, pmax)));
      if (!p.some((x) => x > 0)) p[r.int(0, n - 1)] = 1;
      let total = p.reduce((a, b) => a + b, 0);
      const lines = [`${n} ${q}`, p.join(' ')];
      for (let k = 0; k < q; k++) {
        if (r.next() < updateP) {
          const i = r.int(0, n - 1);
          let x = r.next() < zeroP ? 0 : r.int(0, pmax);
          if (total - p[i] + x <= 0) x = 1;
          total += x - p[i];
          p[i] = x;
          lines.push(`1 ${i + 1} ${x}`);
        } else lines.push(`2 ${r.int(0, total - 1)}`);
      }
      return T(lines.join('\n') + '\n');
    };
    out.push(make(8, 30, 5, 0.4, 0.3), make(1000, 1000, 100, 0.5, 0.5), make(200000, 200000, 1e9, 0.5, 0), make(200000, 200000, 1e9, 0.5, 0.99), make(200000, 200000, 3, 0.3, 0.7), make(200000, 200000, 1e9, 0.05, 0), make(131072, 200000, 1e9, 0.9, 0.2));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], q = t[1];
    const tree = new Array<number>(n + 1).fill(0);
    const p = new Array<number>(n + 1).fill(0);
    const add = (i: number, d: number) => { for (; i <= n; i += i & -i) tree[i] += d; };
    for (let i = 1; i <= n; i++) { p[i] = t[1 + i]; add(i, p[i]); }
    let top = 1;
    while (top * 2 <= n) top *= 2;
    const out: number[] = [];
    let pos = 2 + n;
    for (let k = 0; k < q; k++) {
      if (t[pos] === 1) { const i = t[pos + 1], x = t[pos + 2]; add(i, x - p[i]); p[i] = x; pos += 3; }
      else {
        let v = t[pos + 1], idx = 0;
        for (let step = top; step > 0; step >>= 1) if (idx + step <= n && tree[idx + step] <= v) { idx += step; v -= tree[idx]; }
        out.push(idx + 1);
        pos += 2;
      }
    }
    return out.join('\n');
  },
  editorial: `Naively, a sample scans the priorities in $O(n)$, far too slow for $2 \\cdot 10^5$ queries. The DQN-style prioritised replay buffer uses a **sum tree** for exactly this reason; a **Fenwick tree** (binary indexed tree) over the priorities does the same job in a few lines.

- **Update**: add $x - p_i$ to the $O(\\log n)$ nodes covering $i$.
- **Sample**: we want the smallest $i$ with $p_1 + \\dots + p_i > v$. Walk down the implicit tree from the largest power of two $2^k \\le n$: keep a position $idx$ (initially 0) and, for $step = 2^k, 2^{k-1}, \\dots, 1$, if $idx + step \\le n$ and the node $tree[idx + step]$ (the sum of the $step$ elements after $idx$) is **at most** $v$, jump: $idx \\mathrel{+}= step$ and $v \\mathrel{-}= tree[idx]$. At the end $idx$ is the largest index whose prefix sum is $\\le v$, so the answer is $idx + 1$.

Both operations are $O(\\log n)$, for $O((n + q)\\log n)$ in total. Sums reach $2 \\cdot 10^{14}$, so 64-bit integers are required. The "at most" in the descent is what skips elements of priority 0: they never make the prefix sum exceed $v$ on their own.`,
};

/* ---------------------------------------------------------------- 6 */

const nStep: CodingProblem = {
  id: 'n-step-targets',
  title: 'n-Step Targets',
  rating: 1700,
  tags: ['math', 'prefix sums', 'modular arithmetic'],
  timeLimitMs: 2000,
  legend: `A trajectory has $T$ steps, with rewards $r_0, \\dots, r_{T-1}$ (the reward $r_t$ is received after the state $s_t$) and a table of state-value estimates $V_0, \\dots, V_T$ ($V_t$ is the estimate for $s_t$; $s_T$ is the final state). The **$n$-step target** for step $t$ looks $m = \\min(n, T - t)$ steps ahead and then **bootstraps** from the value estimate:

$$G_t^{(n)} = \\sum_{k=0}^{m-1} \\gamma^k\\, r_{t+k} \\;+\\; \\gamma^{m}\\, V_{t+m}.$$

Compute $G_0^{(n)}, \\dots, G_{T-1}^{(n)}$ modulo $998\\,244\\,353$, with $\\gamma = a / b$ read as $a \\cdot b^{-1}$ modulo $998\\,244\\,353$.`,
  inputSpec: `The first line contains $T$, $n$, $a$ and $b$ ($1 \\le T \\le 2 \\cdot 10^5$, $1 \\le n \\le T$, $1 \\le a \\le b \\le 10^6$). The second line contains $r_0, \\dots, r_{T-1}$ and the third line contains $V_0, \\dots, V_T$; all $|r_t|, |V_t| \\le 10^9$.`,
  outputSpec: `Print $T$ integers $G_t^{(n)} \\bmod 998\\,244\\,353$, each in $[0, 998\\,244\\,352]$.`,
  samples: [
    { input: '4 2 1 2\n1 2 3 4\n10 20 30 40 50\n', output: '499122186 499122190 499122194 29\n', note: `With $\\gamma = 1/2$ the true targets are $19/2,\\ 27/2,\\ 35/2,\\ 29$. The last one only looks one step ahead: $4 + \\tfrac12 \\cdot 50$.` },
  ],
  generateTests() {
    const r = rng(7006);
    const out: TestCase[] = [T('4 2 1 2\n1 2 3 4\n10 20 30 40 50\n'), T('1 1 1 1\n-5\n7 -3\n')];
    const make = (Tn: number, n: number, a: number, b: number, big: boolean) => {
      const rs = Array.from({ length: Tn }, () => (big ? r.int(-1e9, 1e9) : r.int(-9, 9)));
      const vs = Array.from({ length: Tn + 1 }, () => (big ? r.int(-1e9, 1e9) : r.int(-9, 9)));
      return T(`${Tn} ${n} ${a} ${b}\n${rs.join(' ')}\n${vs.join(' ')}\n`);
    };
    out.push(make(10, 3, 9, 10, false), make(10, 10, 1, 3, false), make(1000, 1, 999999, 1000000, true), make(200000, 1, 1, 1, true), make(200000, 200000, 1, 1, true), make(200000, 200000, 999999, 1000000, true), make(200000, 100000, 1, 1000000, true), make(200000, 57, 3, 7, true));
    return out;
  },
  reference(input) {
    const t = tokens(input);
    const Tn = Number(t[0]), n = Number(t[1]);
    const g = (BigInt(t[2]) * inv(BigInt(t[3]))) % P, ig = inv(g);
    const rs = t.slice(4, 4 + Tn).map(BigInt), vs = t.slice(4 + Tn, 5 + 2 * Tn).map(BigInt);
    const pw = new Array<bigint>(Tn + 1), ipw = new Array<bigint>(Tn + 1);
    pw[0] = 1n; ipw[0] = 1n;
    for (let i = 1; i <= Tn; i++) { pw[i] = (pw[i - 1] * g) % P; ipw[i] = (ipw[i - 1] * ig) % P; }
    const pre = new Array<bigint>(Tn + 1); // pre[j] = sum_{i<j} g^i r_i
    pre[0] = 0n;
    for (let i = 0; i < Tn; i++) pre[i + 1] = md(pre[i] + pw[i] * rs[i]);
    const out = new Array<string>(Tn);
    for (let s = 0; s < Tn; s++) {
      const m = Math.min(n, Tn - s);
      out[s] = String(md((pre[s + m] - pre[s]) * ipw[s] + pw[m] * vs[s + m]));
    }
    return out.join(' ');
  },
  editorial: `The direct formula costs $O(n)$ per target, so $O(Tn)$ overall: too slow when $n$ is large. Because the discount weights form a geometric progression, a **prefix sum** of discounted rewards solves it.

Define $S_j = \\sum_{i < j} \\gamma^i r_i$. Then
$$\\sum_{k=0}^{m-1} \\gamma^k r_{t+k} = \\gamma^{-t}\\,\\bigl(S_{t+m} - S_t\\bigr),$$
since every term of the difference carries the extra factor $\\gamma^{t}$. Precompute $\\gamma^i$, $\\gamma^{-i}$ and $S_j$ in $O(T)$; each target is then $\\gamma^{-t}(S_{t+m} - S_t) + \\gamma^m V_{t+m}$, in $O(1)$.

All the arithmetic is modulo $p = 998\\,244\\,353$. The inverse $\\gamma^{-1} = b \\cdot a^{-1}$ exists because $1 \\le a < p$ (this is why $a \\ge 1$ is required). Reduce after every product and keep a final \`((x % p) + p) % p\` for negative values.

The two extremes are familiar: $n = 1$ gives the TD(0) target $r_t + \\gamma V_{t+1}$, and $n = T$ gives the full Monte Carlo return (plus $\\gamma^{T-t} V_T$). A3C-style methods use short horizons like $n = 5$.`,
};

/* ---------------------------------------------------------------- 7 */

const countOptimal: CodingProblem = {
  id: 'optimal-plan-count',
  title: 'Count the Best Plans',
  rating: 1500,
  tags: ['dp', 'graphs', 'counting'],
  timeLimitMs: 2000,
  legend: `A deterministic environment has states $1, \\dots, n$ and $m$ actions. Action $j$ moves the agent from state $u_j$ to a later state $v_j > u_j$ and gives the reward $w_j$, which may be negative. Several actions may connect the same pair of states and they count as different. An **episode** starts in state 1 and ends when the agent reaches state $n$; its return is the sum of the rewards on the way (there is no discounting). State $n$ can always be reached from state 1.

Find the **optimal return** and the **number of different action sequences** that achieve it, modulo $998\\,244\\,353$.`,
  inputSpec: `The first line contains $n$ and $m$ ($2 \\le n \\le 10^5$, $1 \\le m \\le 2 \\cdot 10^5$). Each of the next $m$ lines contains $u_j$, $v_j$, $w_j$ ($1 \\le u_j < v_j \\le n$, $|w_j| \\le 10^9$). Only action sequences that go from state 1 to state $n$ are counted.`,
  outputSpec: `Print two integers: the optimal return and the number of optimal action sequences modulo $998\\,244\\,353$.`,
  samples: [
    { input: '4 6\n1 2 1\n1 3 1\n2 4 2\n3 4 2\n1 4 3\n2 3 -1\n', output: '3 3\n', note: `The optimal return is 3, reached by $1 \\to 2 \\to 4$, $1 \\to 3 \\to 4$ and $1 \\to 4$. The path $1 \\to 2 \\to 3 \\to 4$ only gets 2.` },
    { input: '2 3\n1 2 -5\n1 2 -5\n1 2 -7\n', output: '-5 2\n' },
  ],
  generateTests() {
    const r = rng(7007);
    const out: TestCase[] = [T('4 6\n1 2 1\n1 3 1\n2 4 2\n3 4 2\n1 4 3\n2 3 -1\n'), T('2 3\n1 2 -5\n1 2 -5\n1 2 -7\n')];
    const make = (n: number, extra: number, wmax: number, span: number) => {
      const es: string[] = [];
      for (let i = 1; i < n; i++) es.push(`${i} ${i + 1} ${r.int(-wmax, wmax)}`);
      for (let k = 0; k < extra; k++) {
        const u = r.int(1, n - 1);
        es.push(`${u} ${Math.min(n, u + r.int(1, span))} ${r.int(-wmax, wmax)}`);
      }
      return T(`${n} ${es.length}\n${es.join('\n')}\n`);
    };
    out.push(make(6, 8, 2, 3), make(30, 60, 1, 4), make(1000, 1000, 3, 10), make(100000, 100000, 1, 5), make(100000, 100000, 1e9, 1000), make(100000, 100000, 0, 3), make(100000, 100000, 1, 1), make(18, 60, 0, 17), make(100000, 100000, 1, 100000));
    return out;
  },
  reference(input) {
    const t = tokens(input).map(Number);
    const n = t[0], m = t[1];
    const adj: number[][] = Array.from({ length: n + 1 }, () => []);
    for (let j = 0; j < m; j++) adj[t[2 + 3 * j]].push(j);
    const best = new Array<number>(n + 1).fill(-Infinity), cnt = new Array<number>(n + 1).fill(0);
    best[1] = 0; cnt[1] = 1;
    for (let u = 1; u < n; u++) {
      if (best[u] === -Infinity) continue;
      for (const j of adj[u]) {
        const v = t[3 + 3 * j], val = best[u] + t[4 + 3 * j];
        if (val > best[v]) { best[v] = val; cnt[v] = cnt[u]; }
        else if (val === best[v]) cnt[v] = (cnt[v] + cnt[u]) % 998244353;
      }
    }
    return `${best[n]} ${cnt[n]}`;
  },
  editorial: `Every action goes to a higher-numbered state, so the states are already in **topological order** and a single left-to-right pass is a valid dynamic program. Let $best[v]$ be the optimal return of any action sequence from state 1 to $v$, and $cnt[v]$ the number of sequences that achieve it. They obey the Bellman optimality equation for a deterministic environment,
$$best[v] = \\max_{(u, v, w)} \\bigl(best[u] + w\\bigr).$$

Process the states in increasing order, and relax every action $(u, v, w)$ leaving $u$ once $best[u]$ is final: if $best[u] + w$ beats $best[v]$, replace it and **copy** $cnt[u]$; if it ties, **add** $cnt[u]$ (modulo $p$). Parallel actions are separate edges, so they add separately. This is the standard "shortest path with a counter" pattern.

The time is $O(n + m)$. The return is at most $10^5 \\cdot 10^9 = 10^{14}$ in absolute value, so it needs a 64-bit integer, while the counter stays below $2p$ before reduction. Only the counts need the modulus: the optimal return itself is printed exactly.`,
};

export const rlCodingProblems: CodingProblem[] = [returnsToGo, qTrace, firstVisit, corridor, sumTree, nStep, countOptimal];
