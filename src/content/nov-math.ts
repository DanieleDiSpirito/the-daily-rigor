import type { MathPuzzle } from '../types';

/* Late-November puzzles (23 – 30 Nov 2026): they follow the regular programme. */

export const novMathPuzzles: MathPuzzle[] = [
  {
    id: 'nugget-boundary',
    title: 'Boxes of Nuggets',
    topic: 'Number theory · Frobenius problem',
    difficulty: 'Introductory',
    statement: `A restaurant sells nuggets only in boxes of **6**, **9** and **20**. You may buy any number of boxes of each size, but you cannot open a box.

What is the **largest number of nuggets** that it is impossible to buy exactly?`,
    answerFormat: 'a positive integer',
    answer: 43,
    tolerance: 0,
    answerDisplay: '43',
    hints: [
      'Every combination of 6s and 9s is a multiple of 3. Which totals are left once you also allow some boxes of 20?',
      'If you can buy six consecutive totals, you can buy every larger total too: just add a box of 6 as many times as needed.',
    ],
    solution: `**43 cannot be bought.** Using $k$ boxes of 20 leaves $43 - 20k$ nuggets to be made of 6s and 9s, that is $43, 23, 3$ for $k = 0, 1, 2$. Sums of 6s and 9s are multiples of 3, and the smallest positive one is 6, so none of $43, 23, 3$ qualifies.

**Everything above 43 can.** The six consecutive totals 44 to 49 are all reachable:
$$44 = 4\\cdot 6 + 20,\\quad 45 = 5 \\cdot 9,\\quad 46 = 6 + 2\\cdot 20,\\quad 47 = 3 \\cdot 9 + 20,\\quad 48 = 8 \\cdot 6,\\quad 49 = 9 + 2 \\cdot 20.$$
Adding boxes of 6 to these reaches every larger number. So the answer is 43.

This is an instance of the Frobenius coin problem. For two coprime sizes $a, b$ the largest impossible total is $ab - a - b$; for three sizes there is no closed formula.`,
  },
  {
    id: 'birthday-twenty-three',
    title: 'A Shared Birthday',
    topic: 'Probability · Birthday problem',
    difficulty: 'Introductory',
    statement: `Birthdays are independent and uniform over the 365 days of the year (ignore 29 February and twins).

What is the **smallest number of people** in a room for the probability that at least two of them share a birthday to reach $\\tfrac12$ or more?`,
    answerFormat: 'a positive integer',
    answer: 23,
    tolerance: 0,
    answerDisplay: '23',
    hints: [
      'It is easier to compute the probability that all birthdays are different, and subtract from 1.',
      'For $n$ people the chance that all differ is $\\frac{365}{365}\\cdot\\frac{364}{365}\\cdots\\frac{365-n+1}{365}$. Find the first $n$ for which this drops below $\\tfrac12$.',
    ],
    solution: `With $n$ people, the probability that all birthdays differ is
$$q_n = \\prod_{k=0}^{n-1} \\frac{365 - k}{365}.$$
Computing the product: $q_{22} \\approx 0.5243$ (so a match has probability only about 0.4757), and $q_{23} \\approx 0.4927$, so a match has probability about **0.5073**. The smallest $n$ is 23.

The intuition is that there are $\\binom{23}{2} = 253$ pairs, each matching with probability $1/365$, so about $0.69$ matches are expected, and $1 - e^{-0.69} \\approx \\tfrac12$. The number of people needed grows like $\\sqrt{N}$, not like $N$.`,
  },
  {
    id: 'secretary-hundred',
    title: 'Hiring the Best of a Hundred',
    topic: 'Optimal stopping · Probability',
    difficulty: 'Intermediate',
    statement: `One hundred candidates are interviewed one by one, in a uniformly random order. After each interview you can rank the candidate against those already seen, but you must immediately hire or reject, and a rejection is final. You want to hire the single best candidate overall.

You use this strategy: **reject the first $k$ candidates** whatever happens, then hire the first candidate who is better than everyone seen so far (hiring the last one if nobody is).

Which value of $k$ **maximises** the probability of hiring the best candidate?`,
    answerFormat: 'an integer between 0 and 99',
    answer: 37,
    tolerance: 0,
    answerDisplay: '37',
    hints: [
      'Condition on the position $j$ of the best candidate. You hire them exactly when the best of the first $j-1$ candidates sits among the first $k$.',
      'That gives a success probability $P(k) = \\frac{k}{n}\\sum_{j=k+1}^{n} \\frac{1}{j-1}$. For large $n$ it behaves like $-x \\ln x$ with $x = k/n$.',
    ],
    solution: `Let $n = 100$. If the best candidate is in position $j > k$, the strategy hires them precisely when the best among the first $j - 1$ candidates lies in the first $k$ (otherwise someone earlier would have been hired). This happens with probability $k/(j-1)$, so
$$P(k) = \\sum_{j=k+1}^{n} \\frac{1}{n}\\cdot\\frac{k}{j-1} = \\frac{k}{n}\\sum_{j=k+1}^{n}\\frac{1}{j-1}.$$
For large $n$, with $x = k/n$ this tends to $-x\\ln x$, which is largest at $x = 1/e$ with value $1/e \\approx 0.368$.

Evaluating the exact sum for $n = 100$ gives the maximum at $k = 37$, with success probability $\\approx 0.371$. Rejecting about the first $37\\%$ of candidates is the classical rule.`,
  },
  {
    id: 'record-highs',
    title: 'Record Highs',
    topic: 'Linearity of expectation · Permutations',
    difficulty: 'Introductory',
    statement: `Ten distinct numbers are put in a uniformly random order and read from left to right. Call a number a **record** if it is larger than every number before it (so the first number is always a record).

What is the **expected number of records**?`,
    answerFormat: 'an exact fraction (e.g. 7/3) or a decimal',
    answer: 7381 / 2520,
    tolerance: 1e-6,
    answerDisplay: '7381/2520',
    hints: [
      'Use an indicator variable for each position and add up their expectations; you do not need the joint distribution.',
      'Position $i$ holds a record if the largest among the first $i$ numbers is in position $i$. By symmetry, how likely is that?',
    ],
    solution: `Let $X_i = 1$ if position $i$ holds a record. Among the first $i$ numbers each is equally likely to be the largest, so $\\Pr[X_i = 1] = 1/i$. By linearity of expectation,
$$\\mathbb{E}[\\text{records}] = \\sum_{i=1}^{10} \\frac{1}{i} = H_{10} = \\frac{7381}{2520} \\approx 2.929.$$
Linearity holds even though the indicators are not independent (in fact they happen to be). For $n$ numbers the expectation $H_n \\approx \\ln n + 0.577$ grows very slowly.`,
  },
  {
    id: 'merging-numbers',
    title: 'The Merging Blackboard',
    topic: 'Invariants · Algebra',
    difficulty: 'Intermediate',
    statement: `The numbers $1, 2, 3, \\dots, 10$ are written on a blackboard. A move erases two numbers $a$ and $b$ and writes $a + b + ab$ in their place. After nine moves a single number remains.

What is that number? (It does not depend on the order of the moves.)`,
    answerFormat: 'a positive integer',
    answer: 39916799,
    tolerance: 0,
    answerDisplay: '39916799',
    hints: [
      'Look for a quantity that does not change in a move. Try $a + b + ab + 1$ and compare it with the quantities for $a$ and $b$ alone.',
      '$a + b + ab + 1 = (a+1)(b+1)$. What happens to the product of all the numbers plus one?',
    ],
    solution: `Since $a + b + ab + 1 = (a+1)(b+1)$, replacing $a, b$ by $a + b + ab$ replaces the factors $(a+1)$ and $(b+1)$ by their product. Therefore the **product of $(x + 1)$ over all numbers $x$ on the board is invariant**.

Initially the product is $2 \\cdot 3 \\cdots 11 = 11!= 39916800$. At the end one number $N$ remains, so $N + 1 = 11!$ and
$$N = 11! - 1 = 39916799.$$`,
  },
  {
    id: 'ballot-seven-three',
    title: 'Never Behind',
    topic: 'Combinatorics · Reflection principle',
    difficulty: 'Introductory',
    statement: `In an election candidate A receives **7** votes and candidate B receives **3**. The ten ballots are counted one at a time, in a uniformly random order.

What is the **probability** that A is strictly ahead of B at every moment of the count, from the first ballot onwards?`,
    answerFormat: 'an exact fraction (e.g. 2/5) or a decimal',
    answer: 0.4,
    tolerance: 1e-6,
    answerDisplay: '2/5',
    hints: [
      'Think of the count as a path that steps up for A and down for B. You want paths that never return to height 0.',
      'Count the bad paths that start with a ballot for A and touch height 0 by reflecting the part before the first touch.',
    ],
    solution: `There are $\\binom{10}{3} = 120$ equally likely orders. A good order must start with a vote for A, and there are $\\binom{9}{3} = 84$ such orders. After that first vote the path is at height 1 and has 9 steps left, ending at height 4. Among these 84 paths, the bad ones touch height 0. Reflecting the part up to the first touch turns each bad path into a path from height $-1$ to height 4 in 9 steps, which has 7 up-steps and 2 down-steps, and conversely. So there are $\\binom{9}{2} = 36$ bad paths, and $84 - 36 = 48$ good ones:
$$\\Pr = \\frac{48}{120} = \\frac{2}{5}.$$
This agrees with the **ballot theorem**: A stays strictly ahead with probability $\\frac{a - b}{a + b} = \\frac{7 - 3}{10}$.`,
  },
  {
    id: 'monotone-subsequence',
    title: 'Up or Down, Five Times',
    topic: 'Pigeonhole · Extremal combinatorics',
    difficulty: 'Intermediate',
    statement: `Find the **smallest integer $n$** such that every ordering of $n$ distinct real numbers contains a monotone subsequence of length 5, that is, 5 entries (not necessarily adjacent) that are either increasing or decreasing from left to right.`,
    answerFormat: 'a positive integer',
    answer: 17,
    tolerance: 0,
    answerDisplay: '17',
    hints: [
      'To each entry associate the pair (length of the longest increasing subsequence ending there, length of the longest decreasing subsequence ending there). Can two entries share a pair?',
      'If no monotone subsequence has length 5, how many different pairs are possible? For the lower bound, try arranging 16 numbers in four blocks.',
    ],
    solution: `**Upper bound.** Give each entry $x_i$ the pair $(u_i, d_i)$: the length of the longest increasing subsequence ending at $x_i$ and of the longest decreasing one ending at $x_i$. For $i < j$ the pairs differ: if $x_i < x_j$ then $u_j > u_i$, and if $x_i > x_j$ then $d_j > d_i$. If no monotone subsequence of length 5 existed, every pair would lie in $\\{1,\\dots,4\\}^2$, which has only 16 elements, so a sequence of 17 entries is impossible.

**Lower bound.** The ordering
$$4,3,2,1,\\ 8,7,6,5,\\ 12,11,10,9,\\ 16,15,14,13$$
has 16 entries, and its longest increasing and decreasing subsequences both have length 4. Hence 16 is not enough and the answer is $(5-1)^2 + 1 = 17$. This is the Erdős–Szekeres theorem.`,
  },
  {
    id: 'knight-return',
    title: 'The Wandering Knight',
    topic: 'Markov chains · Random walks on graphs',
    difficulty: 'Advanced',
    statement: `A knight starts on a corner of an empty $8 \\times 8$ chessboard. At each step it makes one of its legal moves, chosen uniformly at random among all the legal moves from its current square.

What is the **expected number of moves** until the knight first returns to its starting corner?`,
    answerFormat: 'a positive integer',
    answer: 168,
    tolerance: 0,
    answerDisplay: '168',
    hints: [
      'A random walk on a connected graph has a stationary distribution proportional to the degree of each vertex.',
      'For an irreducible finite chain the expected return time to a state $s$ is $1/\\pi(s)$. Count the total degree of the knight graph.',
    ],
    solution: `Squares are the vertices of a graph whose edges are knight moves; the walk picks a uniformly random neighbour. The graph is connected, and the walk is reversible with stationary distribution
$$\\pi(v) = \\frac{\\deg v}{\\sum_u \\deg u}.$$
For an irreducible finite Markov chain the expected return time to $v$ is $1/\\pi(v)$.

The degrees on the board, from the corner inwards, are 2, 3, 4, 6, 8: the sum over all 64 squares is $336$ (the board has $168$ knight moves, each counted from both ends). A corner has degree 2, so $\\pi(\\text{corner}) = 2/336$ and the expected return time is $336/2 = 168$.`,
  },
];
