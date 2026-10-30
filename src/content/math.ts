import type { MathPuzzle } from '../types';
import { withRlWeek } from './schedule';
import { rlMathPuzzles } from './rl-math';

const regularPuzzles: MathPuzzle[] = [
  {
    id: 'poisoned-cask-ternary',
    title: 'The Poisoned Cask, Revisited',
    topic: 'Information theory · Number bases',
    difficulty: 'Intermediate',
    statement: `A king holds 1000 casks of wine, exactly one of which has been poisoned. The poison is undetectable by any means except its effect: a person who drinks even a drop dies **exactly 24 hours** later, with no earlier symptoms.

The royal banquet begins in **48 hours**. The king may employ tasters, each of whom may sip from any number of casks at any moment. A taster who dies is, naturally, unavailable thereafter; surviving tasters may drink again. Sips are negligible in volume.

What is the **minimum number of tasters** that guarantees the poisoned cask is identified before the banquet begins?`,
    answerFormat: 'a positive integer',
    answer: 7,
    tolerance: 0,
    answerDisplay: '7',
    hints: [
      'With only 24 hours the classical answer is 10, because $2^{10} = 1024 \\ge 1000$: each taster either dies or survives, encoding one binary digit. What changes when there is time for a second round?',
      'Count the distinguishable outcomes for a single taster in 48 hours. A taster may die after the first day, die after the second day, or survive.',
    ],
    solution: `**Upper bound.** Write each cask number $0, 1, \\dots, 999$ in base 3 using seven digits, which suffices because $3^7 = 2187 \\ge 1000$. At hour 0, taster $i$ sips from every cask whose $i$-th ternary digit is 1. At hour 24, every surviving taster $i$ sips from every cask whose $i$-th digit is 2. Casks with digit 0 are never tasted by taster $i$.

Taster $i$ therefore dies at hour 24 if the digit is 1, dies at hour 48 if it is 2, and survives if it is 0. The pattern of deaths reads off the poisoned cask's number digit by digit.

**Lower bound.** Each taster has at most three outcomes, so $n$ tasters produce at most $3^n$ distinguishable observations. Since $3^6 = 729 < 1000$, six tasters cannot separate all the casks.

More generally, with $r$ rounds available, each taster carries $\\log_2(r+1)$ bits of information, and the answer is $\\lceil \\log_{r+1} N \\rceil$.`,
  },
  {
    id: 'ants-collisions',
    title: 'Collisions on a Rod',
    topic: 'Invariants · Combinatorics',
    difficulty: 'Intermediate',
    statement: `Twenty-five ants are placed at distinct points on a horizontal rod of length one metre. Each ant faces either left or right and walks at a constant speed of 1 cm/s. When two ants meet, both instantly reverse direction. An ant reaching either end of the rod falls off.

You may choose both the initial positions and the initial directions. What is the **maximum possible total number of collisions** before every ant has fallen off?`,
    answerFormat: 'a non-negative integer',
    answer: 156,
    tolerance: 0,
    answerDisplay: '156',
    hints: [
      'Ants are indistinguishable to an outside observer. What does a collision look like if you ignore the labels?',
      'Two ants bouncing off each other is indistinguishable from two ants passing through one another. Under this view, which pairs ever meet?',
    ],
    solution: `Replace the ants by "ghosts" that pass through each other. As unlabelled sets, the configuration of ghosts and the configuration of ants coincide at all times, so every collision of ants corresponds to exactly one crossing of two ghosts, and conversely.

A ghost never changes direction. Hence two ghosts cross if and only if the left one moves right and the right one moves left; they then meet at the midpoint of their initial positions, which happens before either falls off.

If $r$ ants face right, the number of crossings is at most $r(25 - r)$, attained by placing every right-facing ant to the left of every left-facing ant. This product is maximised at $r = 12$ or $r = 13$, giving $12 \\cdot 13 = 156$.

The same trick shows that, regardless of the configuration, every ant has left the rod after at most 100 seconds.`,
  },
  {
    id: 'broken-stick',
    title: 'The Broken Stick',
    topic: 'Geometric probability',
    difficulty: 'Introductory',
    statement: `A stick of unit length is broken at two points chosen independently and uniformly at random along its length.

What is the **probability** that the three resulting pieces can be arranged to form a (non-degenerate) triangle?`,
    answerFormat: 'an exact fraction (e.g. 2/5) or a decimal',
    answer: 0.25,
    tolerance: 1e-3,
    answerDisplay: '1/4',
    hints: [
      'By the triangle inequality, three lengths summing to 1 form a triangle if and only if every piece is shorter than 1/2.',
      'Represent the two break points as a point $(x, y)$ in the unit square and shade the favourable region.',
    ],
    solution: `Let the break points be $x$ and $y$, uniform on $[0,1]^2$. By symmetry assume $x < y$, so the pieces are $x$, $y - x$ and $1 - y$. A triangle exists if and only if each piece is less than $1/2$:
$$x < 1/2, \\quad y - x < 1/2, \\quad y > 1/2.$$

Within the triangle $\\{0 < x < y < 1\\}$, of area $1/2$, these three constraints cut out a smaller triangle with vertices $(0, 1/2)$, $(1/2, 1/2)$ and $(1/2, 1)$, whose area is $1/8$.

The probability is therefore $\\frac{1/8}{1/2} = \\frac{1}{4}$.`,
  },
  {
    id: 'waiting-for-hh',
    title: 'Waiting for Two Heads',
    topic: 'Markov chains · Expectation',
    difficulty: 'Intermediate',
    statement: `A fair coin is tossed repeatedly until two consecutive heads (HH) appear for the first time.

What is the **expected number of tosses**, counting the final one?

(Curiously, the expected waiting time for the pattern HT differs from that for HH, although both patterns have probability 1/4 at any given pair of positions.)`,
    answerFormat: 'a number',
    answer: 6,
    tolerance: 1e-6,
    answerDisplay: '6',
    hints: [
      'Define states by how much of the target pattern you have just matched: nothing, or a single H.',
      'Write linear equations for the expected remaining time from each state, by conditioning on the next toss.',
    ],
    solution: `Let $E_0$ be the expected number of further tosses from the empty state, and $E_1$ from the state "the last toss was H". Conditioning on the next toss:
$$E_0 = 1 + \\tfrac12 E_1 + \\tfrac12 E_0, \\qquad E_1 = 1 + \\tfrac12 \\cdot 0 + \\tfrac12 E_0.$$

The first equation gives $E_0 = 2 + E_1$. Substituting into the second gives $E_1 = 1 + 1 + \\tfrac12 E_1$, so $E_1 = 4$ and $E_0 = 6$.

For HT, a failure after H (another H) does not reset progress, which gives an expected time of 4. Self-overlapping patterns take longer to appear, a fact formalised by Conway's leading-number algorithm and by martingale arguments.`,
  },
  {
    id: 'coupon-collector-die',
    title: 'Every Face of the Die',
    topic: 'Expectation · Coupon collector',
    difficulty: 'Introductory',
    statement: `A fair six-sided die is rolled repeatedly until every one of the six faces has appeared at least once.

What is the **expected number of rolls**?`,
    answerFormat: 'an exact fraction or a decimal',
    answer: 14.7,
    tolerance: 1e-3,
    answerDisplay: '147/10 = 14.7',
    hints: [
      'Split the process into phases: phase $k$ starts when exactly $k - 1$ distinct faces have been seen.',
      'Each phase has a geometric waiting time. What is its success probability?',
    ],
    solution: `In phase $k$ (with $k - 1$ faces already seen) each roll shows a new face with probability $p_k = \\frac{6 - k + 1}{6}$, so the phase length is geometric with mean $\\frac{6}{7 - k}$. By linearity of expectation,
$$\\mathbb{E}[T] = \\sum_{k=1}^{6} \\frac{6}{7-k} = 6\\left(1 + \\tfrac12 + \\tfrac13 + \\tfrac14 + \\tfrac15 + \\tfrac16\\right) = 6 \\cdot \\tfrac{49}{20} = 14.7.$$

In general $n H_n \\approx n \\ln n + \\gamma n$ draws are required to collect $n$ coupons.`,
  },
  {
    id: 'tuesday-boy',
    title: 'A Boy Born on a Tuesday',
    topic: 'Conditional probability',
    difficulty: 'Advanced',
    statement: `A family has two children. Assume that each child is independently a boy or a girl with probability 1/2, and is born on each of the seven weekdays with probability 1/7, independently of sex.

You ask the parent: "Is at least one of your children a boy born on a Tuesday?" The answer is **yes**.

What is the **probability that both children are boys**?`,
    answerFormat: 'an exact fraction or a decimal',
    answer: 13 / 27,
    tolerance: 1e-3,
    answerDisplay: '13/27',
    hints: [
      'Each child is one of 14 equally likely (sex, weekday) types, so there are $14^2 = 196$ equally likely ordered pairs.',
      'Count the pairs containing at least one Tuesday boy, then the subset in which both children are boys.',
    ],
    solution: `Each child has one of 14 equally likely types, so the ordered pairs number $196$. A pair contains no Tuesday boy in $13^2 = 169$ cases, so the conditioning event has $196 - 169 = 27$ outcomes.

Among two-boy pairs ($7^2 = 49$), those with no Tuesday boy number $6^2 = 36$, leaving $13$. Hence
$$\\Pr(\\text{two boys} \\mid \\text{at least one Tuesday boy}) = \\frac{13}{27} \\approx 0.481.$$

The answer lies between $1/3$ (the answer to "at least one boy") and $1/2$ (the answer if a specific child is identified). The more specific the information, the closer it comes to singling out one child. The result depends on *how* the information was obtained: had the parent volunteered a fact about a randomly chosen child, the answer would be $1/2$.`,
  },
  {
    id: 'hats-parity',
    title: 'Prisoners and Hats',
    topic: 'Parity · Binary encoding',
    difficulty: 'Intermediate',
    statement: `One hundred prisoners stand in a single file, each facing forward. Each wears a hat that is either black or white, assigned adversarially. Every prisoner sees all the hats in front of them, but not their own nor those behind.

Starting from the back of the line and moving forward, each prisoner in turn says aloud one word, "black" or "white", which everyone hears. A prisoner who names the colour of their own hat is spared. The prisoners may agree on a strategy beforehand but cannot communicate otherwise.

What is the **largest number of prisoners who can be guaranteed** to be spared?`,
    answerFormat: 'a non-negative integer',
    answer: 99,
    tolerance: 0,
    answerDisplay: '99',
    hints: [
      'The last prisoner cannot possibly be guaranteed survival. Can their single word convey enough information to save everyone else?',
      'Think of the colours as bits and consider their sum modulo 2.',
    ],
    solution: `The prisoner at the back sees 99 hats and announces "black" if the number of black hats ahead is odd, and "white" otherwise. This person survives with probability $1/2$ at best, and nothing can be guaranteed for them.

Every subsequent prisoner knows the announced parity, sees all hats ahead, and has heard every (correct) answer from behind except the first. Together these determine the parity of their own hat, so they answer correctly. Hence $99$ prisoners are guaranteed to be spared.

No strategy can guarantee all 100: the first speaker receives no information about their own hat, so an adversary can always choose that hat to contradict their answer.`,
  },
  {
    id: 'two-eggs',
    title: 'Two Eggs, One Hundred Floors',
    topic: 'Optimisation · Worst-case analysis',
    difficulty: 'Intermediate',
    statement: `A building has 100 floors. There is an unknown critical floor $F \\in \\{0, 1, \\dots, 100\\}$ such that an egg dropped from any floor above $F$ breaks, while an egg dropped from floor $F$ or below survives (and may be reused). Floor 0 means that every drop breaks the egg.

You have **two identical eggs**. What is the **minimum number of drops** that suffices, in the worst case, to determine $F$ with certainty?`,
    answerFormat: 'a positive integer',
    answer: 14,
    tolerance: 0,
    answerDisplay: '14',
    hints: [
      'Once the first egg breaks, the second egg must test the remaining floors one by one from the bottom.',
      'If your budget is $k$ drops, the first drop should be from floor $k$. Where should the second drop of the first egg be?',
    ],
    solution: `Suppose $k$ drops are allowed. If the first egg is dropped from floor $k$ and breaks, the second egg checks floors $1, \\dots, k-1$ in order, using at most $k$ drops in total. If it survives, the problem reduces to the floors above with budget $k - 1$, so the next drop is $k - 1$ floors higher, and so on.

With $k$ drops one can therefore cover $k + (k-1) + \\dots + 1 = \\frac{k(k+1)}{2}$ floors. We need $\\frac{k(k+1)}{2} \\ge 100$. Since $\\frac{13 \\cdot 14}{2} = 91 < 100 \\le 105 = \\frac{14 \\cdot 15}{2}$, the answer is $14$.

A matching lower bound follows from the same recurrence. With $e$ eggs and $k$ drops the number of floors that can be resolved is $\\sum_{i=1}^{e} \\binom{k}{i}$.`,
  },
  {
    id: 'gamblers-ruin',
    title: "The Gambler's Last Coins",
    topic: 'Random walks · Martingales',
    difficulty: 'Introductory',
    statement: `A gambler holds 3 coins and plays a sequence of fair bets: each round they win one coin or lose one coin with probability $\\tfrac12$, independently. They stop as soon as they reach **10 coins** (a win) or **0 coins** (ruin).

What is the **probability** that they end up with 10 coins?`,
    answerFormat: 'an exact fraction (e.g. 2/5) or a decimal',
    answer: 0.3,
    tolerance: 1e-6,
    answerDisplay: '3/10',
    hints: [
      'Let $p_k$ be the success probability starting from $k$ coins. Condition on the first bet to relate $p_k$ to $p_{k-1}$ and $p_{k+1}$.',
      'The recurrence says that $p_k$ is the average of its neighbours, so $p_k$ is a linear function of $k$.',
    ],
    solution: `Conditioning on the first round gives $p_k = \\tfrac12 p_{k-1} + \\tfrac12 p_{k+1}$ with boundary values $p_0 = 0$ and $p_{10} = 1$. A sequence in which every term is the mean of its neighbours is arithmetic, so $p_k = k/10$ and $p_3 = 3/10$.

Equivalently, the gambler's fortune is a martingale, so $\\mathbb{E}[\\text{final fortune}] = 3$. The final fortune is 10 with probability $p$ and 0 otherwise, hence $10p = 3$.`,
  },
  {
    id: 'two-sixes',
    title: 'Two Sixes in a Row',
    topic: 'Markov chains · Expectation',
    difficulty: 'Intermediate',
    statement: `A fair six-sided die is rolled repeatedly until a **6 is rolled twice in a row** for the first time.

What is the **expected number of rolls**, counting the last one?`,
    answerFormat: 'a number',
    answer: 42,
    tolerance: 1e-6,
    answerDisplay: '42',
    hints: [
      'Use two states: "the last roll was not a 6" and "the last roll was a 6". Write the expected remaining rolls from each.',
      'From the state "just rolled a 6", a non-6 sends you back to the start state.',
    ],
    solution: `Let $E_0$ be the expected number of further rolls when the last roll was not a 6 (or at the start), and $E_1$ when the last roll was a 6. Then
$$E_0 = 1 + \\tfrac16 E_1 + \\tfrac56 E_0, \\qquad E_1 = 1 + \\tfrac56 E_0.$$

The first equation gives $E_0 = 6 + E_1$. Substituting into the second: $E_1 = 1 + \\tfrac56(6 + E_1) = 6 + \\tfrac56 E_1$, so $E_1 = 36$ and $E_0 = 42$.

In general, waiting for $k$ consecutive successes of probability $p$ takes $\\frac{p^{-k} - 1}{1 - p}$ trials on average; here $\\frac{36 - 1}{5/6} = 42$.`,
  },
  {
    id: 'no-adjacent-ones',
    title: 'Lonely Ones',
    topic: 'Recurrences · Binary strings',
    difficulty: 'Introductory',
    statement: `How many binary strings of length **12** contain **no two adjacent 1s**?`,
    answerFormat: 'a positive integer',
    answer: 377,
    tolerance: 0,
    answerDisplay: '377',
    hints: [
      'Look at the last character. If it is 0, what constraint is left on the first 11 characters? If it is 1, what must the previous character be?',
      'Let $a_n$ be the count for length $n$. Find $a_n$ in terms of $a_{n-1}$ and $a_{n-2}$ and compute the first terms.',
    ],
    solution: `Let $a_n$ be the number of valid strings of length $n$. A valid string ends either in 0, preceded by any valid string of length $n-1$, or in 01, preceded by any valid string of length $n-2$. Hence $a_n = a_{n-1} + a_{n-2}$ with $a_1 = 2$ and $a_2 = 3$.

The sequence runs $2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377$, so $a_{12} = 377 = F_{14}$, a Fibonacci number.`,
  },
  {
    id: 'josephus-100',
    title: 'The Last Soldier Standing',
    topic: 'Recursion · Binary representation',
    difficulty: 'Intermediate',
    statement: `One hundred soldiers stand in a circle, numbered $1$ to $100$ in order. Starting with soldier 1, they count off: soldier 1 **eliminates** soldier 2, soldier 3 eliminates soldier 4, and so on around the circle, always eliminating the next surviving soldier and passing the sword to the one after. The process continues until one soldier remains.

What is the **number of the survivor**?`,
    answerFormat: 'an integer between 1 and 100',
    answer: 73,
    tolerance: 0,
    answerDisplay: '73',
    hints: [
      'Compute the survivor for small $n$ (1, 2, 3, ..., 8) and look for the pattern at powers of two.',
      'If $n = 2^m + \\ell$ with $0 \\le \\ell < 2^m$, then after $\\ell$ eliminations the number of soldiers is a power of two. Who holds the sword at that moment?',
    ],
    solution: `Write $n = 2^m + \\ell$ with $0 \\le \\ell < 2^m$. After $\\ell$ eliminations $2^m$ soldiers remain and the sword is held by soldier $2\\ell + 1$. When the number of soldiers is a power of two, the holder of the sword survives (every pass around the circle halves the group and the sword returns to the same person). Hence the survivor is $J(n) = 2\\ell + 1$.

For $n = 100 = 64 + 36$ we get $J(100) = 2 \\cdot 36 + 1 = 73$. In binary the rule says that $J(n)$ is obtained by rotating the binary digits of $n$ one place to the left: $100 = 1100100_2 \\to 1001001_2 = 73$.`,
  },
  {
    id: 'staying-below-diagonal',
    title: 'Never Above the Diagonal',
    topic: 'Lattice paths · Catalan numbers',
    difficulty: 'Intermediate',
    statement: `A path goes from $(0, 0)$ to $(10, 10)$ using only unit steps **right** $(+1, 0)$ and **up** $(0, +1)$. How many such paths **never go above the line $y = x$** (they may touch it)?`,
    answerFormat: 'a positive integer',
    answer: 16796,
    tolerance: 0,
    answerDisplay: '16796',
    hints: [
      'The total number of paths is $\\binom{20}{10}$. Count the paths that do cross the line $y = x$ and subtract.',
      'For a bad path, find the first step that goes above the diagonal, i.e. touches $y = x + 1$, and reflect the part of the path before it in that line.',
    ],
    solution: `There are $\\binom{20}{10}$ paths in total. Take a bad path, one that touches the line $y = x + 1$, and reflect the portion up to its first touch in that line. This maps it bijectively to a path from $(-1, 1)$ to $(10, 10)$, and there are $\\binom{20}{9}$ of those.

The answer is therefore $\\binom{20}{10} - \\binom{20}{9} = 184756 - 167960 = 16796 = \\frac{1}{11}\\binom{20}{10}$, the tenth Catalan number $C_{10}$.`,
  },
  {
    id: 'first-ace',
    title: 'Waiting for the First Ace',
    topic: 'Linearity of expectation',
    difficulty: 'Introductory',
    statement: `A standard deck of 52 cards is shuffled and dealt face up one card at a time.

What is the **expected number of cards dealt up to and including the first ace**?`,
    answerFormat: 'an exact fraction or a decimal',
    answer: 10.6,
    tolerance: 1e-6,
    answerDisplay: '53/5 = 10.6',
    hints: [
      'The first ace is at position $1 + $ (the number of non-ace cards that precede it). Write that count as a sum of indicators, one per non-ace card.',
      'Consider a single non-ace card together with the four aces. What is the probability that this card comes before all four aces?',
    ],
    solution: `Let $N$ be the position of the first ace. Then $N = 1 + \\sum_{c} I_c$, where the sum runs over the 48 non-ace cards and $I_c = 1$ if $c$ precedes every ace.

Among the five cards formed by $c$ and the four aces, each is equally likely to come first, so $\\Pr[I_c = 1] = \\tfrac15$. Therefore $\\mathbb{E}[N] = 1 + 48 \\cdot \\tfrac15 = \\tfrac{53}{5} = 10.6$.`,
  },
  {
    id: 'domino-3x8',
    title: 'Dominoes on a Narrow Board',
    topic: 'Transfer matrices · Tilings',
    difficulty: 'Advanced',
    statement: `In how many ways can a $3 \\times 8$ rectangle be tiled completely with $1 \\times 2$ dominoes (each placed horizontally or vertically, without overlaps or gaps)?`,
    answerFormat: 'a positive integer',
    answer: 153,
    tolerance: 0,
    answerDisplay: '153',
    hints: [
      'A $3 \\times n$ board can only be tiled if $n$ is even. Let $a_n$ count the tilings of a $3 \\times n$ board and $b_n$ the tilings of a $3 \\times n$ board with one corner cell missing.',
      'Look at the leftmost column: either it is covered by a vertical domino and two horizontal ones, or by a corner configuration that forces a missing-corner board.',
    ],
    solution: `Let $a_n$ be the number of tilings of the $3 \\times n$ board and $b_n$ the number of tilings of the same board with one corner cell removed. Considering the leftmost column gives
$$a_n = a_{n-2} + 2 b_{n-1}, \\qquad b_n = a_{n-1} + b_{n-2}.$$

Eliminating $b$ yields $a_n = 4a_{n-2} - a_{n-4}$ with $a_0 = 1$, $a_2 = 3$. The values are $a_4 = 11$, $a_6 = 41$ and $a_8 = 4 \\cdot 41 - 11 = 153$.`,
  },
  {
    id: 'five-bits',
    title: 'Five Bits Set',
    topic: 'Binary representation · Counting',
    difficulty: 'Intermediate',
    statement: `How many integers $n$ with $1 \\le n \\le 2026$ have **exactly five 1s** in their binary representation?`,
    answerFormat: 'a non-negative integer',
    answer: 462,
    tolerance: 0,
    answerDisplay: '462',
    hints: [
      'Note that $2047 = 2^{11} - 1$ and $2026 = 2047 - 21$. Counting numbers below $2^{11}$ with five 1s is a binomial coefficient.',
      'Instead of counting directly up to 2026, count the numbers from 2027 to 2047 that have five 1s and subtract.',
    ],
    solution: `The integers from $0$ to $2047$ are exactly the 11-bit strings, and $\\binom{11}{5} = 462$ of them have five 1s.

The numbers from $2027$ to $2047$ are $11111101011_2, \\dots, 11111111111_2$; all of them have at least eight 1s (any number above $2026 = 11111101010_2$ keeps the prefix $111111$, which already contributes six 1s). So none of them has exactly five 1s, and all 462 numbers are at most 2026. The answer is $462$.`,
  },
  {
    id: 'digit-sum-twenty',
    title: 'Digits Adding to Twenty',
    topic: 'Generating functions · Inclusion–exclusion',
    difficulty: 'Advanced',
    statement: `How many integers $n$ with $1 \\le n \\le 10^6$ have a **decimal digit sum of exactly 20**?`,
    answerFormat: 'a positive integer',
    answer: 35127,
    tolerance: 0,
    answerDisplay: '35127',
    hints: [
      'The number $10^6$ has digit sum 1, so it does not count. You are counting 6-digit strings $d_1 \\dots d_6$ (leading zeros allowed) with each $d_i \\in \\{0, \\dots, 9\\}$ and $\\sum d_i = 20$.',
      'Count solutions of $d_1 + \\dots + d_6 = 20$ with $d_i \\ge 0$ by stars and bars, then subtract those where some $d_i \\ge 10$ using inclusion–exclusion.',
    ],
    solution: `We count the digit strings $d_1 \\dots d_6$ with $\\sum d_i = 20$ and $0 \\le d_i \\le 9$. Without the upper bound, stars and bars gives $\\binom{25}{5} = 53130$.

If $d_i \\ge 10$ for a specific $i$, substitute $d_i' = d_i - 10$ to obtain $\\binom{15}{5} = 3003$ solutions. There are 6 choices of $i$. Two digits both at least 10 would need a sum of at least 20, which gives only the single case $d_i = d_j = 10$ and the rest 0: $\\binom{5}{5} = 1$ solution for each of the $\\binom62 = 15$ pairs.

By inclusion–exclusion the count is $53130 - 6 \\cdot 3003 + 15 \\cdot 1 = 53130 - 18018 + 15 = 35127$. The all-zero string cannot occur because the digit sum is 20, so no correction is needed for $n = 0$.`,
  },
  {
    id: 'three-heads-in-a-row',
    title: 'Three in a Row',
    topic: 'Markov chains · Expectation',
    difficulty: 'Intermediate',
    statement: `A fair coin is tossed repeatedly until **three consecutive heads** (HHH) appear for the first time.

What is the **expected number of tosses**?`,
    answerFormat: 'a number',
    answer: 14,
    tolerance: 1e-6,
    answerDisplay: '14',
    hints: [
      'States: the current run of trailing heads has length 0, 1 or 2. A tail always sends you back to state 0.',
      'Write $E_0 = 1 + \\tfrac12 E_1 + \\tfrac12 E_0$ and the analogous equations for $E_1$ and $E_2$, then solve the linear system.',
    ],
    solution: `With $E_j$ the expected remaining tosses when the current run of heads has length $j$:
$$E_0 = 1 + \\tfrac12 E_1 + \\tfrac12 E_0, \\quad E_1 = 1 + \\tfrac12 E_2 + \\tfrac12 E_0, \\quad E_2 = 1 + \\tfrac12 \\cdot 0 + \\tfrac12 E_0.$$

The last equation gives $E_2 = 1 + \\tfrac12 E_0$. The second then gives $E_1 = 1 + \\tfrac12 + \\tfrac14 E_0 + \\tfrac12 E_0 = \\tfrac32 + \\tfrac34 E_0$. The first equation reads $E_0 = 2 + E_1$, so $E_0 = \\tfrac72 + \\tfrac34 E_0$, i.e. $\\tfrac14 E_0 = \\tfrac72$ and $E_0 = 14$.

The closed form for $k$ heads in a row is $2^{k+1} - 2$.`,
  },
  {
    id: 'cube-walk',
    title: 'A Walk Across the Cube',
    topic: 'Random walks · Symmetry',
    difficulty: 'Advanced',
    statement: `A bug sits at one vertex of a cube. At every step it moves along a uniformly random one of the three edges leaving its current vertex.

What is the **expected number of steps** until it first reaches the vertex **diametrically opposite** its starting vertex?`,
    answerFormat: 'a number',
    answer: 10,
    tolerance: 1e-6,
    answerDisplay: '10',
    hints: [
      'By symmetry, only the distance to the target matters: 3 (start), 2, 1, or 0 (done). Each step changes the distance by exactly one.',
      'From distance 3 the bug must go to distance 2. From distance 2, one of three edges leads closer. From distance 1, one of three edges reaches the target.',
    ],
    solution: `Let $e_d$ be the expected remaining steps at distance $d$ from the target (in edges). A vertex at distance 3 has three neighbours at distance 2; a vertex at distance 2 has one neighbour at distance 3 and two at distance 1; a vertex at distance 1 has two neighbours at distance 2 and one at distance 0. So
$$e_3 = 1 + e_2, \\qquad e_2 = 1 + \\tfrac13 e_3 + \\tfrac23 e_1, \\qquad e_1 = 1 + \\tfrac23 e_2.$$

Substituting $e_3$ and $e_1$ into the middle equation gives $e_2 = 1 + \\tfrac13 + \\tfrac13 e_2 + \\tfrac23 + \\tfrac49 e_2$, so $\\tfrac29 e_2 = 2$ and $e_2 = 9$. Then $e_3 = 10$.`,
  },
  {
    id: 'hundred-prisoners',
    title: 'Loops in the Boxes',
    topic: 'Permutations · Cycle structure',
    difficulty: 'Advanced',
    statement: `One hundred prisoners are numbered $1$ to $100$. A room holds 100 boxes, also numbered, and a random permutation of the prisoner numbers has been placed inside them, one per box. Each prisoner, in turn and alone, may open **at most 50 boxes**, trying to find their own number. All prisoners are released only if **every** prisoner finds their own number. They may agree on a strategy beforehand but cannot communicate afterwards.

Using the optimal strategy (a prisoner opens the box with their own number first, then the box whose number they found, and so on), what is the **probability** that all prisoners succeed? Give a decimal with at least four digits after the point.`,
    answerFormat: 'a decimal (four digits are enough)',
    answer: 0.3118,
    tolerance: 1e-3,
    answerDisplay: '≈ 0.3118',
    hints: [
      'Following the strategy, each prisoner traces the cycle of the permutation that contains their number. When does a prisoner fail?',
      'All prisoners succeed if and only if the permutation has no cycle longer than 50. Count the permutations with a cycle of length $k > 50$; there can be at most one such cycle.',
    ],
    solution: `A prisoner starting at box $i$ follows the cycle of $i$ in the permutation and finds their own number after as many openings as the cycle length. Everyone succeeds exactly when all cycles have length at most 50.

For $k > 50$, the number of permutations of 100 elements containing a cycle of length $k$ is $\\binom{100}{k}(k-1)!\\,(100-k)! = \\frac{100!}{k}$, and there can be at most one such cycle. So the probability that some cycle is longer than 50 is $\\sum_{k=51}^{100} \\frac1k = H_{100} - H_{50} \\approx 0.6882$.

The success probability is $1 - \\sum_{k=51}^{100} \\frac1k \\approx 0.3118$. Without coordination it would be $2^{-100}$.`,
  },
  {
    id: 'ten-envelopes',
    title: 'Ten Misdelivered Letters',
    topic: 'Derangements · Inclusion–exclusion',
    difficulty: 'Intermediate',
    statement: `A clerk has written ten different letters, each addressed to a different person, and ten matching addressed envelopes. In a hurry, the clerk puts exactly one letter into each envelope, so that the assignment is a permutation of the ten letters.

In how many of the $10!$ possible assignments does **no letter end up in its own envelope**?`,
    answerFormat: 'a positive integer',
    answer: 1334961,
    tolerance: 0,
    answerDisplay: '1334961',
    hints: [
      'Let $A_i$ be the set of assignments in which letter $i$ is in the right envelope. You want $10!$ minus the size of $A_1 \\cup \\dots \\cup A_{10}$.',
      'The intersection of any $k$ of the sets $A_i$ has $(10 - k)!$ elements. Apply inclusion–exclusion.',
    ],
    solution: `By inclusion–exclusion, the number of permutations with no fixed point is
$$D_{10} = \\sum_{k=0}^{10} (-1)^k \\binom{10}{k} (10-k)! = 10!\\sum_{k=0}^{10} \\frac{(-1)^k}{k!}.$$

Evaluating gives $D_{10} = 1334961$. Equivalently, the derangement numbers satisfy $D_n = (n-1)(D_{n-1} + D_{n-2})$ with $D_1 = 0$ and $D_2 = 1$, which produces $1, 2, 9, 44, 265, 1854, 14833, 133496, 1334961$.

Since $\\sum (-1)^k/k! \\to 1/e$, the fraction of permutations that are derangements is already within $10^{-7}$ of $1/e \\approx 0.3679$ for $n = 10$.`,
  },
];

/** Regular programme with the RL week (31 Oct – 6 Nov) slotted in after the first five days. */
export const mathPuzzles: MathPuzzle[] = withRlWeek(regularPuzzles, rlMathPuzzles);
