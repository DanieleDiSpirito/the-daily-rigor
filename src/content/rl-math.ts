import type { MathPuzzle } from '../types';

/* Reinforcement-learning week: seven puzzles on Bellman equations, TD targets, bandits and importance sampling.
   Every answer is recomputed independently in scripts/verify-content.ts. */

export const rlMathPuzzles: MathPuzzle[] = [
  {
    id: 'two-state-chain',
    title: 'Value of a Two-State Chain',
    topic: 'Reinforcement learning · Bellman equations · Markov chains',
    difficulty: 'Introductory',
    statement: `A **Markov reward process** has two states, $A$ and $B$, and discount factor $\\gamma = \\tfrac12$.

- In state $A$ the agent receives reward $1$, then moves to $A$ or $B$ with probability $\\tfrac12$ each.
- In state $B$ the agent receives reward $0$, then moves to $A$ with probability $\\tfrac13$ and stays in $B$ with probability $\\tfrac23$.

The **value** $V(s)$ of a state is the expected discounted sum of rewards $r_0 + \\gamma r_1 + \\gamma^2 r_2 + \\dots$ when the process starts in $s$ (the reward of the starting state counts as $r_0$).

What is $V(A)$?`,
    answerFormat: 'an exact fraction such as 3/7, or a decimal',
    answer: 16 / 11,
    tolerance: 1e-4,
    answerDisplay: '16/11',
    hints: [
      'Write the Bellman equation for each state: the value is the immediate reward plus $\\gamma$ times the expected value of the next state.',
      'You get two linear equations in two unknowns, $V(A)$ and $V(B)$.',
    ],
    solution: `The Bellman equations are
$$V(A) = 1 + \\tfrac12\\left(\\tfrac12 V(A) + \\tfrac12 V(B)\\right), \\qquad V(B) = 0 + \\tfrac12\\left(\\tfrac13 V(A) + \\tfrac23 V(B)\\right).$$

The second gives $V(B)\\,(1 - \\tfrac13) = \\tfrac16 V(A)$, so $V(B) = \\tfrac14 V(A)$. Substituting in the first, $V(A) = 1 + \\tfrac14 V(A) + \\tfrac14 \\cdot \\tfrac14 V(A) = 1 + \\tfrac5{16} V(A)$, hence $V(A) = \\tfrac{16}{11}$, and $V(B) = \\tfrac{4}{11}$.

In matrix form, $V = R + \\gamma P V$ gives $V = (I - \\gamma P)^{-1} R$; the inverse exists for $\\gamma < 1$ because $\\gamma P$ is a contraction. This is exact **policy evaluation**, what TD learning approximates from samples.`,
  },
  {
    id: 'sarsa-vs-q',
    title: 'SARSA or Q-Learning?',
    topic: 'Reinforcement learning · Temporal difference · On-policy vs off-policy',
    difficulty: 'Introductory',
    statement: `An agent is in state $s$, takes action $a$ with current estimate $Q(s, a) = 2$, receives reward $r = 1$ and lands in state $s'$, where the estimates are $Q(s', \\cdot) = (3,\\ 5,\\ 4)$ for its three actions. The learning rate is $\\alpha = 0.5$ and the discount is $\\gamma = 0.9$.

The agent follows an $\\varepsilon$-greedy policy and, by exploring, picks the **third** action in $s'$.

Let $Q_{\\text{Q-learning}}(s,a)$ and $Q_{\\text{SARSA}}(s,a)$ be the updated values under the two algorithms. What is $Q_{\\text{Q-learning}}(s,a) - Q_{\\text{SARSA}}(s,a)$?`,
    answerFormat: 'a decimal',
    answer: 0.45,
    tolerance: 1e-6,
    answerDisplay: '0.45',
    hints: [
      'Q-learning bootstraps from the best action in $s\'$, whatever the agent actually does there; SARSA bootstraps from the action actually taken.',
      'Both updates have the form $Q \\leftarrow Q + \\alpha\\,(\\text{target} - Q)$.',
    ],
    solution: `Q-learning (off-policy) uses the target $r + \\gamma \\max_b Q(s', b) = 1 + 0.9 \\cdot 5 = 5.5$, so $Q \\leftarrow 2 + 0.5\\,(5.5 - 2) = 3.75$.

SARSA (on-policy) uses the action actually chosen, $a' = $ third, with $Q(s', a') = 4$: the target is $1 + 0.9 \\cdot 4 = 4.6$, so $Q \\leftarrow 2 + 0.5\\,(4.6 - 2) = 3.3$.

The difference is $\\alpha\\gamma\\,(5 - 4) = 0.5 \\cdot 0.9 \\cdot 1 = 0.45$. Whenever the exploratory action is the greedy one, the two algorithms coincide. Otherwise Q-learning evaluates the greedy policy while SARSA evaluates the $\\varepsilon$-greedy one, which is why SARSA is more cautious near cliffs in the classic gridworld example.`,
  },
  {
    id: 'corridor-hitting-time',
    title: 'The Reflecting Corridor',
    topic: 'Reinforcement learning · Random walks · Expected hitting times',
    difficulty: 'Intermediate',
    statement: `An agent moves along the states $0, 1, \\dots, 10$. The goal is state $10$. From every state $1, \\dots, 9$ the agent moves one step left or right with probability $\\tfrac12$ each (a uniformly random policy); from state $0$ it always moves to state $1$. Each move takes one time step.

What is the **expected number of steps** needed to reach state $10$ starting from state $0$?`,
    answerFormat: 'an integer',
    answer: 100,
    tolerance: 0,
    answerDisplay: '100',
    hints: [
      'Let $E_i$ be the expected time to reach the goal from $i$. Then $E_{10} = 0$, $E_0 = 1 + E_1$ and $E_i = 1 + \\tfrac12 E_{i-1} + \\tfrac12 E_{i+1}$.',
      'Look at the differences $\\Delta_i = E_i - E_{i+1}$. What recurrence do they satisfy?',
    ],
    solution: `Rearranging $E_i = 1 + \\tfrac12 E_{i-1} + \\tfrac12 E_{i+1}$ gives $E_i - E_{i+1} = 2 + (E_{i-1} - E_i)$, that is $\\Delta_i = \\Delta_{i-1} + 2$. From the wall, $\\Delta_0 = E_0 - E_1 = 1$, so $\\Delta_i = 2i + 1$.

Then $E_0 = \\Delta_0 + \\Delta_1 + \\dots + \\Delta_9 = \\sum_{i=0}^{9} (2i + 1) = 10^2 = 100$.

In general the answer is $n^2$ for a corridor of length $n$: the typical random-walk scaling, distance squared. It also explains why undirected exploration is so slow in sparse-reward problems.`,
  },
  {
    id: 'discounted-walk',
    title: 'A Discounted Random Walk',
    topic: 'Reinforcement learning · Policy evaluation · Discounting',
    difficulty: 'Intermediate',
    statement: `Take the corridor with states $0, 1, 2, 3, 4$, where state $4$ is terminal. From state $0$ the agent moves to state $1$; from states $1, 2, 3$ it moves left or right with probability $\\tfrac12$ each. Each move gives reward $0$, except for the move that enters state $4$, which gives reward $1$. The discount factor is $\\gamma = 0.9$, and the value is $V(s) = \\mathbb E\\bigl[R_1 + \\gamma R_2 + \\gamma^2 R_3 + \\dots\\bigr]$, where $R_1$ is the reward of the first move.

What is the value $V(0)$ of the starting state under this random policy? Give it to three decimal places.`,
    answerFormat: 'a decimal with three digits, for example 0.123',
    answer: 7290 / 21761,
    tolerance: 1e-3,
    answerDisplay: '7290/21761 ≈ 0.335',
    hints: [
      'Write $V(s) = \\mathbb E[R + \\gamma V(s\')]$ for the non-terminal states, with $V(4) = 0$.',
      'You may eliminate unknowns one by one: $V(0) = \\gamma V(1)$, then express everything via $V(1)$ and $V(2)$.',
    ],
    solution: `With $\\gamma = \\tfrac9{10}$ the Bellman equations are
$$V_0 = \\gamma V_1,\\quad V_1 = \\tfrac\\gamma2 (V_0 + V_2),\\quad V_2 = \\tfrac\\gamma2 (V_1 + V_3),\\quad V_3 = \\tfrac12 + \\tfrac\\gamma2 V_2.$$

The last equation holds because from state 3 half of the time the agent enters the goal and collects reward 1 (nothing is left to discount afterwards), and half of the time it falls back to state 2.

Substituting $V_0 = \\gamma V_1$ in the second equation gives $V_1 (1 - \\tfrac{\\gamma^2}{2}) = \\tfrac\\gamma2 V_2$. Continuing the elimination (or solving the $4 \\times 4$ system) yields
$$V_0 = \\frac{7290}{21761} \\approx 0.335,\\quad V_1 = \\frac{8100}{21761},\\quad V_2 = \\frac{10710}{21761},\\quad V_3 = \\frac{15700}{21761}.$$

Values increase towards the goal, and the start is worth far less than $\\gamma^3 = 0.729$, which is what the shortest path (four moves, the reward arriving on the last one) would give: the random policy wastes time, and each wasted step costs a factor $\\gamma$.`,
  },
  {
    id: 'value-iteration-bound',
    title: 'How Many Sweeps?',
    topic: 'Reinforcement learning · Dynamic programming · Contraction mappings',
    difficulty: 'Intermediate',
    statement: `Value iteration starts from $V_0 \\equiv 0$ in an MDP with discount $\\gamma = 0.9$ and rewards in $[0, 1]$. Each sweep applies the Bellman optimality operator $T$, which is a $\\gamma$-contraction in the max-norm: $\\|TV - TW\\|_\\infty \\le \\gamma\\,\\|V - W\\|_\\infty$.

The optimal value function satisfies $0 \\le V^* \\le \\frac{1}{1-\\gamma}$. Using only the contraction property, what is the **smallest number of sweeps $k$** that guarantees $\\|V_k - V^*\\|_\\infty < 0.01$?`,
    answerFormat: 'a positive integer',
    answer: 66,
    tolerance: 0,
    answerDisplay: '66',
    hints: [
      'Since $V^* = TV^*$ and $V_k = T V_{k-1}$, we have $\\|V_k - V^*\\| \\le \\gamma \\|V_{k-1} - V^*\\|$.',
      'So $\\|V_k - V^*\\|_\\infty \\le \\gamma^k \\|V_0 - V^*\\|_\\infty \\le \\gamma^k / (1-\\gamma)$. Find the smallest $k$ with $10 \\cdot 0.9^k < 0.01$.',
    ],
    solution: `By the contraction property, $\\|V_k - V^*\\|_\\infty \\le \\gamma^k\\,\\|V_0 - V^*\\|_\\infty \\le \\dfrac{\\gamma^k}{1 - \\gamma} = 10 \\cdot 0.9^k$.

We need $10 \\cdot 0.9^k < 0.01$, that is $0.9^k < 10^{-3}$, or $k > \\dfrac{3 \\ln 10}{-\\ln 0.9} \\approx 65.56$. So $k = 66$ (for $k = 65$ the bound is $0.0106$, not enough; for $k = 66$ it is $0.00955$).

The number of sweeps grows like $\\log(1/\\varepsilon) / (1 - \\gamma)$ for $\\gamma$ close to 1: the effective horizon $1/(1-\\gamma)$ sets the cost of dynamic programming. The bound is a guarantee, in practice value iteration usually converges faster.`,
  },
  {
    id: 'step-size-memory',
    title: 'How Long Does a Prior Last?',
    topic: 'Reinforcement learning · Bandits · Step sizes',
    difficulty: 'Intermediate',
    statement: `A bandit agent estimates the value of an arm with the incremental rule $Q_{n+1} = Q_n + \\alpha\\,(R_n - Q_n)$ with a **constant** step size $\\alpha = 0.1$ and an optimistic initial guess $Q_1 = 5$.

Unrolling the recursion writes $Q_{n+1}$ as a weighted average of $Q_1$ and the rewards $R_1, \\dots, R_n$. What is the **smallest $n$** for which the weight of the initial guess $Q_1$ in $Q_{n+1}$ is below $1\\%$?`,
    answerFormat: 'a positive integer',
    answer: 44,
    tolerance: 0,
    answerDisplay: '44',
    hints: [
      'Rewrite the update as $Q_{n+1} = (1 - \\alpha) Q_n + \\alpha R_n$ and unroll it.',
      'The weight of $Q_1$ is $(1 - \\alpha)^n$. Solve $0.9^n < 0.01$.',
    ],
    solution: `Unrolling gives
$$Q_{n+1} = (1-\\alpha)^n Q_1 + \\sum_{i=1}^{n} \\alpha\\,(1-\\alpha)^{n-i} R_i,$$
and the weights add up to $1$. The initial guess has weight $0.9^n$, which is below $0.01$ when $n > \\dfrac{\\ln 100}{-\\ln 0.9} \\approx 43.7$. Hence $n = 44$ ($0.9^{43} \\approx 0.0108$, $0.9^{44} \\approx 0.0097$).

Compare with the **sample average**, $\\alpha_n = 1/n$: there the weight of $Q_1$ after one update is zero, and every reward weighs the same. A constant step size forgets the past exponentially, which is what you want in a non-stationary problem, and it explains why optimistic initial values encourage exploration only for a limited time.`,
  },
  {
    id: 'importance-sampling-variance',
    title: 'The Price of Off-Policy Data',
    topic: 'Reinforcement learning · Off-policy evaluation · Importance sampling',
    difficulty: 'Advanced',
    statement: `A bandit has three arms with deterministic rewards $1$, $2$ and $3$. Data is collected by a **behaviour** policy $b = (\\tfrac12, \\tfrac14, \\tfrac14)$. We want the value of the **target** policy $\\pi = (0, \\tfrac12, \\tfrac12)$ using one sample $A \\sim b$ and the **ordinary importance-sampling** estimator
$$\\hat v = \\frac{\\pi(A)}{b(A)}\\, R(A).$$

The estimator is unbiased. What is its **variance**? Give an exact fraction or a decimal.`,
    answerFormat: 'an exact fraction such as 3/7, or a decimal',
    answer: 27 / 4,
    tolerance: 1e-6,
    answerDisplay: '27/4',
    hints: [
      'First compute the mean, which should equal the true value of $\\pi$, to check the setup.',
      '$\\mathbb E[\\hat v^2] = \\sum_a b(a)\\,\\bigl(\\pi(a) R(a) / b(a)\\bigr)^2 = \\sum_a \\pi(a)^2 R(a)^2 / b(a)$.',
    ],
    solution: `The mean is $\\mathbb E_b[\\hat v] = \\sum_a \\pi(a) R(a) = \\tfrac12 \\cdot 2 + \\tfrac12 \\cdot 3 = \\tfrac52$, as it must.

For the second moment,
$$\\mathbb E_b[\\hat v^2] = \\sum_a \\frac{\\pi(a)^2 R(a)^2}{b(a)} = 0 + \\frac{(1/4)\\cdot 4}{1/4} + \\frac{(1/4)\\cdot 9}{1/4} = 4 + 9 = 13.$$

So $\\operatorname{Var}(\\hat v) = 13 - \\left(\\tfrac52\\right)^2 = \\tfrac{27}{4}$.

The variance is large because the ratio $\\pi/b$ is 2 on the two arms that matter, and the second moment carries it squared divided by $b$. Over a horizon of $T$ steps the weights multiply, $\\prod_t \\pi(a_t|s_t) / b(a_t|s_t)$, so the variance can grow **exponentially** with $T$. This is why PPO clips the probability ratio, and why TRPO keeps the new policy close to the old one.`,
  },
];
