import type { Paper } from '../types';

/* Reinforcement-learning week: seven papers, from the foundations (TD, Q-learning, REINFORCE, policy gradients)
   to the deep-RL methods (DQN, A3C, PPO) that are the basis of RLHF for language models. */

export const rlPapers: Paper[] = [
  {
    id: 'sutton-1988-td',
    title: 'Learning to Predict by the Methods of Temporal Differences',
    authors: 'R. S. Sutton',
    year: 1988,
    venue: 'Machine Learning 3(1), 9–44',
    url: 'https://link.springer.com/article/10.1007/BF00115009',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Foundations', 'Temporal difference'],
    readingMinutes: 45,
    summary: `Sutton considers the problem of **prediction**: given sequences of observations that end in an outcome, learn to predict the outcome. Conventional supervised learning waits for the outcome and moves every prediction towards it. **Temporal-difference (TD) methods** instead move each prediction towards the *next* prediction, so learning happens at every step, before the outcome is known.

The paper defines the family TD($\\lambda$), where $\\lambda \\in [0, 1]$ controls how far back the temporal-difference error is propagated through eligibility traces. TD(1) turns out to be the supervised (Widrow–Hoff) procedure, while TD(0) bootstraps from the very next prediction. The paper proves convergence results for the linear case and shows, on a bounded random-walk example, that intermediate values of $\\lambda$ learn faster than the supervised method.`,
    whyItMatters: `TD learning is the engine of nearly all of value-based reinforcement learning: Q-learning, SARSA, actor–critic methods and DQN are all TD methods. The key idea, **learning a guess from a guess**, is the "bootstrapping" that makes RL data-efficient, and the paper's analysis of its bias–variance trade-off is still the standard picture.`,
    keyIdeas: [
      'TD error: $\\delta_t = r_{t+1} + \\gamma V(s_{t+1}) - V(s_t)$, the difference between consecutive predictions',
      'TD($\\lambda$): eligibility traces blend one-step bootstrapping and full-outcome learning',
      'TD(1) matches the supervised (Widrow–Hoff) method on the data, TD(0) is a different and often better estimator',
      'Incremental learning without waiting for the final outcome, with less memory and computation',
      'Bounded random-walk experiment with five non-terminal states, where the true values are known: 1/6, 2/6, 3/6, 4/6, 5/6',
    ],
    readingGuide: `Read the opening sections carefully: they define prediction learning and the TD($\\lambda$) update. Then study the random-walk experiments, which are the clearest demonstration of why bootstrapping helps. The convergence proof may be skimmed on a first pass; try to understand the statement of the theorem rather than the details.`,
    quiz: [
      {
        prompt: 'What does a temporal-difference method use as the target for the prediction $V(s_t)$?',
        options: [
          'Only the final outcome of the sequence',
          'The next prediction (plus the reward received in between), so it bootstraps',
          'The average prediction over the whole sequence',
          'A separately learned model of the environment',
        ],
        correct: 1,
        explanation: `TD(0) moves $V(s_t)$ towards $r_{t+1} + \\gamma V(s_{t+1})$, using its own current estimate of the next state. Supervised (Monte Carlo) learning would instead use the final outcome.`,
      },
      {
        prompt: 'In the TD($\\lambda$) family, which value of $\\lambda$ corresponds to the supervised Widrow–Hoff procedure (using the final outcome as the target)?',
        options: ['$\\lambda = 0$', '$\\lambda = 0.5$', '$\\lambda = 1$', 'It is not part of the family'],
        correct: 2,
        explanation: `For $\\lambda = 1$ the eligibility trace does not decay, so each prediction is eventually corrected by the whole sequence of later errors, which add up to the difference with the final outcome. $\\lambda = 0$ is one-step bootstrapping.`,
      },
      {
        prompt: 'What is the main advantage of TD methods over supervised learning on prediction tasks, as argued in the paper?',
        options: [
          'They need no learning rate',
          'They update at every step without waiting for the outcome, and make better use of the data',
          'They always converge in one pass',
          'They work only with tabular representations, which makes them simpler',
        ],
        correct: 1,
        explanation: `TD methods learn incrementally, need less memory (no need to store the whole sequence) and, in the random-walk example, reach lower error with the same amount of data, because they exploit the Markov structure of the process.`,
      },
      {
        prompt: 'In the bounded random-walk example (five non-terminal states, start in the centre, outcome 1 when exiting on the right and 0 on the left), what are the true predictions for the five states?',
        options: ['0.5 for all five', '1/6, 2/6, 3/6, 4/6, 5/6', '0, 0.25, 0.5, 0.75, 1', '1/5, 2/5, 3/5, 4/5, 1'],
        correct: 1,
        explanation: `With a fair walk the probability of ending on the right from the $i$-th of five states is $i/6$ (a gambler's-ruin argument with two absorbing ends), so the true values are $1/6, 2/6, \\dots, 5/6$.`,
      },
      {
        prompt: 'Which of these methods is NOT a temporal-difference method?',
        options: ['Q-learning', 'SARSA', 'First-visit Monte Carlo evaluation', 'TD(0)'],
        correct: 2,
        explanation: `Monte Carlo evaluation waits for the end of the episode and uses the actual return as the target, with no bootstrapping. Q-learning and SARSA are the control versions of TD(0).`,
      },
    ],
  },
  {
    id: 'watkins-dayan-1992',
    title: 'Q-Learning',
    authors: 'C. J. C. H. Watkins, P. Dayan',
    year: 1992,
    venue: 'Machine Learning 8(3–4), 279–292',
    url: 'https://link.springer.com/article/10.1007/BF00992698',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Value-based methods', 'Off-policy learning'],
    readingMinutes: 30,
    summary: `The paper presents **Q-learning**, an algorithm that learns the optimal action-value function $Q^*(s, a)$ of a Markov decision process directly from experience, without a model of the environment. After each transition $(s, a, r, s')$ it applies
$$Q(s, a) \\leftarrow Q(s, a) + \\alpha\\,\\bigl(r + \\gamma \\max_{b} Q(s', b) - Q(s, a)\\bigr).$$

Because the target uses the **maximum** over next actions, the learned values describe the greedy policy no matter how the data was collected, so Q-learning is an **off-policy** method. The authors prove that $Q$ converges to $Q^*$ with probability 1 provided every state–action pair is tried infinitely often and the learning rates satisfy the standard stochastic-approximation conditions. The proof builds an auxiliary "action-replay process" whose values coincide with the learned ones.`,
    whyItMatters: `Q-learning is the prototype of value-based reinforcement learning. Its off-policy nature allows learning from old data, from demonstrations or while exploring, which is the property that experience replay in DQN relies on. Almost every deep value-based method is Q-learning with a function approximator.`,
    keyIdeas: [
      'Optimal action values: $Q^*(s,a) = \\mathbb E[r + \\gamma \\max_b Q^*(s\', b)]$',
      'Update towards the one-step target with the max over next actions',
      'Off-policy: the behaviour can be exploratory while the values describe the greedy policy',
      'Convergence w.p. 1 for tabular $Q$ if all pairs are visited infinitely often and $\\sum \\alpha = \\infty$, $\\sum \\alpha^2 < \\infty$',
      'Model-free: no transition probabilities or reward model are ever estimated',
    ],
    readingGuide: `Read the sections that define the algorithm and the problem setting, then the statement of the convergence theorem and the intuition of the action-replay process; the proof can be skimmed on a first pass.`,
    quiz: [
      {
        prompt: 'Why is Q-learning called an off-policy algorithm?',
        options: [
          'Because it does not use a policy at all',
          'Because the values it learns describe the greedy policy, whatever policy generated the data',
          'Because it needs a model of the environment',
          'Because it only works with deterministic policies',
        ],
        correct: 1,
        explanation: `The target $r + \\gamma \\max_b Q(s', b)$ evaluates the greedy policy regardless of the action actually taken next. SARSA, in contrast, uses the action taken by the behaviour policy and is on-policy.`,
      },
      {
        prompt: 'Which conditions guarantee convergence of tabular Q-learning to $Q^*$ with probability 1?',
        options: [
          'A constant learning rate and a greedy policy',
          'Every state–action pair visited infinitely often, and learning rates with $\\sum \\alpha = \\infty$ and $\\sum \\alpha^2 < \\infty$',
          'A known transition model and a small state space',
          'Only that rewards are bounded',
        ],
        correct: 1,
        explanation: `These are the Robbins–Monro conditions plus sufficient exploration. A constant step size does not converge exactly (it keeps tracking noise), and a purely greedy policy might never visit some pairs.`,
      },
      {
        prompt: 'What does Q-learning assume about the environment model?',
        options: [
          'Nothing: it is model-free and learns from sampled transitions',
          'It must know the transition probabilities',
          'It must know the reward function but not the transitions',
          'It requires a deterministic environment',
        ],
        correct: 0,
        explanation: `The update only uses sampled transitions $(s, a, r, s')$. It converges for stochastic MDPs as well, because the averaging performed by the learning rate takes care of the randomness.`,
      },
      {
        prompt: 'In the update $Q(s,a) \\leftarrow Q(s,a) + \\alpha\\,[r + \\gamma \\max_b Q(s\',b) - Q(s,a)]$, what is the quantity in square brackets?',
        options: ['The policy gradient', 'The temporal-difference error', 'The advantage of the greedy policy', 'The regret'],
        correct: 1,
        explanation: `It is the TD error: the difference between the bootstrapped target and the current estimate. The update moves the estimate a fraction $\\alpha$ of the way towards the target.`,
      },
      {
        prompt: 'An agent uses an $\\varepsilon$-greedy behaviour policy with $\\varepsilon = 0.1$ and updates with Q-learning. Which policy do its Q-values converge to evaluate?',
        options: [
          'The $\\varepsilon$-greedy policy with $\\varepsilon = 0.1$',
          'The optimal (greedy) policy',
          'A uniformly random policy',
          'The policy that was used at the beginning of training',
        ],
        correct: 1,
        explanation: `Because of the max in the target, the fixed point is $Q^*$, the value of the optimal policy. The agent still behaves $\\varepsilon$-greedily while learning, which is the whole point of off-policy learning.`,
      },
    ],
  },
  {
    id: 'williams-1992-reinforce',
    title: 'Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning',
    authors: 'R. J. Williams',
    year: 1992,
    venue: 'Machine Learning 8(3–4), 229–256',
    url: 'https://link.springer.com/article/10.1007/BF00992696',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Policy gradient', 'Foundations'],
    readingMinutes: 40,
    summary: `Williams introduces the **REINFORCE** family of algorithms for networks of stochastic units trained by a scalar reward. The weights of a stochastic unit are adjusted by
$$\\Delta w = \\alpha\\,(r - b)\\,\\frac{\\partial \\ln g(y; w)}{\\partial w},$$
where $g$ is the probability of the unit's output $y$, $r$ is the reinforcement and $b$ is a **baseline** that does not depend on the output. The central result is that, in expectation, this update is in the direction of the **gradient of the expected reinforcement**, so the algorithm performs stochastic gradient ascent on the expected reward, with no need for a model or for a derivative of the environment.

The paper treats Bernoulli and Gaussian units, relates REINFORCE to earlier associative reward–penalty rules, and discusses the role of the baseline and of the variance of the update.`,
    whyItMatters: `This is the origin of the **policy-gradient** idea: to optimise a stochastic policy, increase the log-probability of actions in proportion to the reward that followed. Modern policy-optimisation algorithms (actor–critic, PPO, and the RLHF used to align language models) are refinements of REINFORCE that reduce its variance.`,
    keyIdeas: [
      'The log-derivative trick: $\\nabla_\\theta \\mathbb E[R] = \\mathbb E[R\\,\\nabla_\\theta \\ln \\pi_\\theta(a)]$',
      'The update is an unbiased estimate of the gradient of expected reward',
      'A baseline $b$ independent of the action leaves the expected update unchanged but can reduce its variance',
      'Works with any differentiable stochastic policy, with no model of the environment',
      'Local learning rule: each unit only needs its own input, output and the global reward',
    ],
    readingGuide: `The core is the definition of REINFORCE algorithms and the first theorem, which proves that the expected update is proportional to the gradient. The sections on specific unit types and on the episodic case are useful but can be read selectively.`,
    quiz: [
      {
        prompt: 'What does the expected REINFORCE update point along?',
        options: [
          'The gradient of the expected reinforcement with respect to the weights',
          'The gradient of the squared error between prediction and reward',
          'The direction of the previous update (momentum)',
          'The gradient of the policy entropy',
        ],
        correct: 0,
        explanation: `Williams's Theorem 1 shows that $\\mathbb E[\\Delta w] = \\alpha\\,\\nabla_w \\mathbb E[r]$ (for a baseline that does not depend on the output). Hence the algorithm is stochastic gradient ascent on expected reward.`,
      },
      {
        prompt: 'Which identity makes it possible to estimate the gradient of an expectation using only samples?',
        options: [
          'Bayes\' rule',
          '$\\nabla_\\theta p_\\theta(x) = p_\\theta(x)\\,\\nabla_\\theta \\ln p_\\theta(x)$ (the log-derivative trick)',
          'The chain rule of backpropagation through the environment',
          'The law of total variance',
        ],
        correct: 1,
        explanation: `Writing $\\nabla_\\theta \\int p_\\theta(x) R(x)\\,dx = \\int p_\\theta(x)\\,\\nabla_\\theta \\ln p_\\theta(x)\\,R(x)\\,dx$ turns the gradient into an expectation that can be estimated from samples of $x$. No derivative of $R$ is needed.`,
      },
      {
        prompt: 'What is the role of the baseline $b$ in $\\Delta w = \\alpha\\,(r - b)\\,\\partial \\ln g / \\partial w$?',
        options: [
          'It makes the estimate unbiased',
          'It reduces the variance of the estimate without changing its expectation (if $b$ does not depend on the sampled output)',
          'It speeds up the convergence of the weights to zero',
          'It replaces the reward',
        ],
        correct: 1,
        explanation: `Since $\\mathbb E[\\nabla \\ln g] = 0$, subtracting an output-independent $b$ does not bias the update. A good baseline (for example the average reward, or a learned state value) lowers the variance considerably.`,
      },
      {
        prompt: 'Which statement about REINFORCE is true?',
        options: [
          'It requires a differentiable model of the environment',
          'It requires the reward to be differentiable with respect to the actions',
          'It works with a scalar reward that may be non-differentiable and unknown in form',
          'It can only be applied to deterministic policies',
        ],
        correct: 2,
        explanation: `The gradient is taken through the probability of the action, not through the reward, so the reward can be any scalar signal (even from a black box). Stochastic outputs are essential, as the log-probability must be differentiable.`,
      },
      {
        prompt: 'What is the main practical weakness of REINFORCE that later methods try to address?',
        options: [
          'It is biased',
          'The gradient estimates have high variance, so learning is sample-inefficient',
          'It needs a tabular representation',
          'It cannot be used with neural networks',
        ],
        correct: 1,
        explanation: `The estimate is unbiased but noisy, because the return of a whole trajectory multiplies every action. Baselines, critics (actor–critic) and trust-region or clipping methods all aim at lowering the variance or controlling the step.`,
      },
    ],
  },
  {
    id: 'sutton-2000-policy-gradient',
    title: 'Policy Gradient Methods for Reinforcement Learning with Function Approximation',
    authors: 'R. S. Sutton, D. McAllester, S. Singh, Y. Mansour',
    year: 2000,
    venue: 'Advances in Neural Information Processing Systems (NIPS) 12',
    url: 'https://papers.nips.cc/paper/1713-policy-gradient-methods-for-reinforcement-learning-with-function-approximation',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Policy gradient', 'Actor–critic'],
    readingMinutes: 30,
    summary: `The paper explains why value-function approaches with function approximation are fragile (small changes in the estimated values can flip the greedy action, and convergence can fail), and proposes to **parametrise the policy directly** and follow the gradient of its performance.

The main result is the **policy gradient theorem**: for a policy $\\pi_\\theta$ the gradient of the performance $\\rho$ (average reward, or return from a start state) is
$$\\nabla_\\theta \\rho = \\sum_s d^{\\pi}(s) \\sum_a \\nabla_\\theta \\pi_\\theta(a \\mid s)\\, Q^{\\pi}(s, a),$$
which holds **without** a term that depends on the gradient of the state distribution $d^\\pi$. The authors then show that $Q^\\pi$ can be replaced by a learned approximation $f_w$ without bias, as long as $f_w$ is **compatible** with the policy parametrisation and minimises the squared error, and prove convergence of the resulting actor–critic algorithm to a local optimum.`,
    whyItMatters: `The theorem is the theoretical basis of modern actor–critic algorithms: A3C, TRPO, PPO and the policy-optimisation stage of RLHF all estimate this gradient using a learned critic. It tells us that to improve a policy we only need $\\nabla \\ln \\pi$ weighted by a value estimate, not a model of how the state distribution changes.`,
    keyIdeas: [
      'Policy gradient theorem: $\\nabla \\rho = \\mathbb E_{s \\sim d^\\pi, a \\sim \\pi}[\\nabla \\ln \\pi(a|s)\\,Q^\\pi(s,a)]$',
      'No gradient of the state distribution appears in the theorem',
      'A baseline, such as $V^\\pi(s)$, can be subtracted, turning $Q$ into the advantage $A = Q - V$',
      'Compatible function approximation: $\\nabla_w f_w(s,a) = \\nabla_\\theta \\ln \\pi_\\theta(a|s)$ gives an unbiased gradient with a critic',
      'Convergence to a local optimum with function approximation, unlike greedy value-based methods',
    ],
    readingGuide: `Read the introduction to see the motivation, then Theorem 1 (the policy gradient theorem) and Theorem 2 (compatible function approximation). The proofs are short and worth following if you know the definitions of $d^\\pi$ and $Q^\\pi$. The application and convergence sections can be skimmed.`,
    quiz: [
      {
        prompt: 'What is surprising about the policy gradient theorem?',
        options: [
          'The gradient is zero at the optimum',
          'The gradient does not include a term for how the state distribution changes with the policy parameters',
          'It does not depend on the value function',
          'It only holds for deterministic policies',
        ],
        correct: 1,
        explanation: `Changing $\\theta$ changes both the actions and which states are visited. One might expect a hard-to-estimate term involving $\\nabla d^\\pi(s)$, but the theorem shows that it cancels out, leaving only $\\nabla \\pi$ weighted by $Q^\\pi$.`,
      },
      {
        prompt: 'Which quantity multiplies $\\nabla_\\theta \\ln \\pi_\\theta(a|s)$ in the policy gradient?',
        options: [
          'The immediate reward',
          'The action-value $Q^\\pi(s,a)$ (or, with a baseline, the advantage)',
          'The discount factor',
          'The entropy of the policy',
        ],
        correct: 1,
        explanation: `In expectation, actions are reinforced in proportion to their long-term value $Q^\\pi(s,a)$. Subtracting a state-dependent baseline $b(s)$ does not change the expectation but reduces variance.`,
      },
      {
        prompt: 'Why do the authors propose a policy-based approach instead of greedy value-based methods with function approximation?',
        options: [
          'Policies need less memory',
          'Small errors in estimated values can change the greedy action discontinuously, and convergence is not guaranteed, whereas the policy changes smoothly with its parameters',
          'Value functions cannot be represented by neural networks',
          'Because policies are always deterministic',
        ],
        correct: 1,
        explanation: `With a differentiable stochastic policy, action probabilities change smoothly with $\\theta$, and gradient ascent converges to a local optimum. Greedy value methods can oscillate or diverge with function approximation.`,
      },
      {
        prompt: 'What does "compatible function approximation" guarantee?',
        options: [
          'That the critic is as accurate as possible',
          'That replacing $Q^\\pi$ by the critic $f_w$ in the policy gradient introduces no bias, when $f_w$ is trained with squared error and $\\nabla_w f = \\nabla_\\theta \\ln \\pi$',
          'That the actor and the critic share the same learning rate',
          'That the policy is Gaussian',
        ],
        correct: 1,
        explanation: `With this compatibility, the error of the critic is orthogonal to the policy-gradient direction, so the gradient computed with $f_w$ equals the exact one. This is the justification for actor–critic architectures.`,
      },
      {
        prompt: 'The advantage function is $A^\\pi(s, a) = Q^\\pi(s, a) - V^\\pi(s)$. How is it used in the policy gradient?',
        options: [
          'It replaces $Q^\\pi$, since $V^\\pi(s)$ acts as a baseline that leaves the expected gradient unchanged and lowers the variance',
          'It is added to the reward to encourage exploration',
          'It is the discount applied to future rewards',
          'It is used to select the learning rate',
        ],
        correct: 0,
        explanation: `Because $\\sum_a \\nabla \\pi(a|s) = 0$, any function of the state alone can be subtracted from $Q$ without bias. Choosing $V^\\pi(s)$ gives the advantage, the standard in A3C, TRPO and PPO.`,
      },
    ],
  },
  {
    id: 'mnih-2015-dqn',
    title: 'Human-Level Control Through Deep Reinforcement Learning',
    authors: 'V. Mnih, K. Kavukcuoglu, D. Silver, A. A. Rusu, J. Veness, M. G. Bellemare, A. Graves, M. Riedmiller, A. K. Fidjeland, G. Ostrovski, S. Petersen, C. Beattie, A. Sadik, I. Antonoglou, H. King, D. Kumaran, D. Wierstra, S. Legg, D. Hassabis',
    year: 2015,
    venue: 'Nature 518, 529–533',
    url: 'https://www.nature.com/articles/nature14236',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Value-based methods', 'Deep learning'],
    readingMinutes: 25,
    summary: `The paper presents the **Deep Q-Network (DQN)**: a convolutional neural network that takes raw pixels (a stack of the last four $84 \\times 84$ frames) and outputs one Q-value per action, trained end to end with a Q-learning target. A single architecture and set of hyperparameters is used for 49 Atari 2600 games, and the agent reaches at least 75% of the score of a professional human tester on 29 of them.

Combining Q-learning with neural networks was known to be unstable. The paper makes it work with two ingredients: **experience replay**, which stores past transitions and trains on random minibatches to break the correlation between consecutive samples, and a **target network**, a periodically updated copy of the network that provides the bootstrapped targets, which stabilises the regression problem.`,
    whyItMatters: `DQN started the field of deep reinforcement learning. Its two tricks (replay buffer and slowly changing target) are used in almost all later off-policy deep RL algorithms, and the paper showed that one general agent could learn from high-dimensional sensory input with only the score as a signal.`,
    keyIdeas: [
      'Q-network on raw frames: input of 4 stacked 84×84 grayscale frames, one output per action',
      'Experience replay: store transitions (capacity 1 million) and train on uniformly sampled minibatches of 32',
      'Target network with parameters $\\theta^-$ copied from the online network every $C = 10{,}000$ updates',
      'Loss: $\\bigl(r + \\gamma \\max_{a\'} Q(s\', a\'; \\theta^-) - Q(s, a; \\theta)\\bigr)^2$',
      'Reward clipping to $[-1, 1]$, frame skipping, $\\varepsilon$-greedy annealed from 1.0 to 0.1',
    ],
    readingGuide: `The main text is short: read it entirely, then the Methods section, which contains the details (preprocessing, architecture, the algorithm box and hyperparameters). Pay attention to the paragraphs on why replay and the target network are necessary, and to the analysis of the learned representations (t-SNE plots) only after that.`,
    quiz: [
      {
        prompt: 'Why does DQN use experience replay?',
        options: [
          'To increase the learning rate',
          'To break the correlations between consecutive samples and reuse each transition many times',
          'To store the optimal policy',
          'To avoid exploration',
        ],
        correct: 1,
        explanation: `Consecutive frames are highly correlated and the data distribution shifts as the policy changes, which destabilises gradient descent. Sampling random minibatches from a large buffer makes the data closer to i.i.d. and improves data efficiency.`,
      },
      {
        prompt: 'What is the purpose of the target network?',
        options: [
          'To compute the policy during evaluation',
          'To provide targets $r + \\gamma \\max_{a\'} Q(s\', a\'; \\theta^-)$ that do not change at every gradient step, which avoids feedback loops and divergence',
          'To reduce the memory of the replay buffer',
          'To ensemble several agents',
        ],
        correct: 1,
        explanation: `If the same network produces both the prediction and the target, every update moves the target too, which can oscillate or diverge. Keeping $\\theta^-$ fixed for $C$ steps makes the regression problem approximately stationary.`,
      },
      {
        prompt: 'Which methodological choice makes DQN\'s result notable across games?',
        options: [
          'A different architecture was designed for each game',
          'The same network architecture and hyperparameters were used for all 49 games, learning from pixels and score only',
          'Expert demonstrations were used for each game',
          'The agent had access to the internal state of the emulator',
        ],
        correct: 1,
        explanation: `The agent receives only pixels and the game score, with a single set of hyperparameters. This generality was the main claim of the paper.`,
      },
      {
        prompt: 'DQN is based on which learning rule?',
        options: ['REINFORCE', 'Q-learning (off-policy TD control) with a neural network as function approximator', 'SARSA with eligibility traces', 'Monte Carlo policy iteration'],
        correct: 1,
        explanation: `The loss is the squared TD error of Q-learning, with the max over next actions computed by the target network. Because it is off-policy, it can learn from the old data stored in the replay buffer.`,
      },
      {
        prompt: 'Why were the rewards clipped to $[-1, 1]$?',
        options: [
          'Because Atari scores are always between -1 and 1',
          'To keep the scale of errors similar across games so that one learning rate works for all of them, at the cost of losing information about reward magnitude',
          'To make the game easier',
          'To avoid negative rewards',
        ],
        correct: 1,
        explanation: `Games have very different score scales. Clipping limits the size of the gradients and allows a single set of hyperparameters, though the agent cannot distinguish a small reward from a large one.`,
      },
    ],
  },
  {
    id: 'mnih-2016-a3c',
    title: 'Asynchronous Methods for Deep Reinforcement Learning',
    authors: 'V. Mnih, A. P. Badia, M. Mirza, A. Graves, T. P. Lillicrap, T. Harley, D. Silver, K. Kavukcuoglu',
    year: 2016,
    venue: 'International Conference on Machine Learning (ICML)',
    url: 'https://arxiv.org/abs/1602.01783',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Actor–critic', 'Deep learning'],
    readingMinutes: 30,
    summary: `The paper proposes a lightweight framework for deep reinforcement learning in which **several actor-learners run in parallel** on different instances of the environment, each computing gradients on its own experience and applying them asynchronously to a shared set of parameters. Because the parallel streams are decorrelated, no replay buffer is needed to stabilise training, and the whole system runs on a **multi-core CPU** rather than a GPU.

The authors apply the idea to four algorithms (one-step Q-learning, one-step SARSA, $n$-step Q-learning and advantage actor–critic), of which the **asynchronous advantage actor–critic (A3C)** works best. A3C uses a shared network with a policy head and a value head, $n$-step returns (up to 5 steps), an advantage estimate $R_t - V(s_t)$ and an entropy bonus to preserve exploration. It surpassed the state of the art on Atari while training for half the time on a single multi-core CPU, and it also handled continuous motor control and 3D maze navigation from pixels.`,
    whyItMatters: `A3C made policy-gradient methods practical for deep networks and popularised the **advantage actor–critic** recipe (value baseline, $n$-step returns, entropy regularisation) that later methods such as PPO build on. Its synchronous variant (A2C) is a standard baseline.`,
    keyIdeas: [
      'Parallel actor-learners whose updates are decorrelated, replacing the replay buffer',
      'Asynchronous (Hogwild-style) updates of shared parameters, with shared RMSProp statistics',
      'Actor–critic with $n$-step returns, $t_{\\max} = 5$, and the advantage $A_t = \\sum_{i} \\gamma^i r_{t+i} + \\gamma^k V(s_{t+k}) - V(s_t)$',
      'Entropy regularisation: $\\beta\\,\\nabla H(\\pi)$ to discourage premature convergence to deterministic policies',
      'Trains on CPUs in a few hours, instead of days on a GPU',
    ],
    readingGuide: `Read the first sections for the framework and the four algorithms, paying special attention to the pseudo-code of A3C (in the supplementary material). In the experiments, look at the Atari learning curves and at the table that compares training time with DQN; the continuous-control and labyrinth results are interesting but secondary.`,
    quiz: [
      {
        prompt: 'What replaces the experience-replay buffer of DQN in the asynchronous methods?',
        options: [
          'A larger network',
          'Many parallel actors exploring different parts of the environment, whose updates are therefore decorrelated',
          'A model of the environment',
          'Prioritised sampling',
        ],
        correct: 1,
        explanation: `At any time the parallel learners are in different states and may follow different exploration policies, so the stream of updates seen by the shared parameters is much less correlated than that of a single agent.`,
      },
      {
        prompt: 'In A3C, what is the advantage estimate used for a rollout of length $k$ starting at $s_t$?',
        options: [
          '$r_t$',
          '$\\sum_{i=0}^{k-1} \\gamma^i r_{t+i} + \\gamma^k V(s_{t+k}) - V(s_t)$ (the $n$-step return minus the baseline)',
          '$V(s_t)$ alone',
          'The entropy of the policy',
        ],
        correct: 1,
        explanation: `The $k$-step return bootstraps from the critic at the end of the rollout. Subtracting $V(s_t)$ gives a lower-variance estimate of how much better the action was than average.`,
      },
      {
        prompt: 'What is the entropy term in the A3C objective for?',
        options: [
          'To speed up the critic',
          'To discourage premature convergence to a deterministic policy by rewarding exploration',
          'To make the gradients smaller',
          'To replace the discount',
        ],
        correct: 1,
        explanation: `Adding $\\beta H(\\pi(\\cdot|s))$ to the objective keeps the action distribution from collapsing early, which improves exploration and robustness.`,
      },
      {
        prompt: 'What hardware setup did the paper emphasise for A3C?',
        options: [
          'A cluster of GPUs',
          'A single machine with a multi-core CPU, with no GPU',
          'A single GPU with a replay buffer',
          'A custom ASIC',
        ],
        correct: 1,
        explanation: `A3C uses several threads on one machine (16 in the main experiments). It matched or surpassed DQN in about half of the time using only a multi-core CPU.`,
      },
      {
        prompt: 'Which statement describes the actor and critic in the A3C network?',
        options: [
          'They are two separate networks with no shared parameters',
          'They share most of the layers, with one output for the policy $\\pi(a|s)$ and one for the value $V(s)$',
          'The critic outputs the action probabilities',
          'The actor outputs the reward',
        ],
        correct: 1,
        explanation: `A shared convolutional (and recurrent) trunk feeds a softmax head for the policy and a linear head for the value. Sharing features makes learning more efficient.`,
      },
    ],
  },
  {
    id: 'schulman-2017-ppo',
    title: 'Proximal Policy Optimization Algorithms',
    authors: 'J. Schulman, F. Wolski, P. Dhariwal, A. Radford, O. Klimov',
    year: 2017,
    venue: 'arXiv preprint',
    url: 'https://arxiv.org/abs/1707.06347',
    field: 'Reinforcement learning',
    topics: ['Reinforcement learning', 'Policy gradient', 'Language models'],
    readingMinutes: 25,
    summary: `The paper introduces **Proximal Policy Optimization (PPO)**, a family of policy-gradient methods that alternate between collecting data with the current policy and optimising a "surrogate" objective for **several epochs** of minibatch updates on the same data. Naively reusing data this way would make the policy move too far; PPO prevents it with a **clipped probability ratio**.

With $r_t(\\theta) = \\pi_\\theta(a_t|s_t) / \\pi_{\\theta_{\\text{old}}}(a_t|s_t)$ and an advantage estimate $\\hat A_t$, the objective is
$$L^{\\text{CLIP}}(\\theta) = \\hat{\\mathbb E}_t\\Bigl[\\min\\bigl(r_t \\hat A_t,\\ \\operatorname{clip}(r_t, 1 - \\varepsilon, 1 + \\varepsilon)\\,\\hat A_t\\bigr)\\Bigr],$$
with $\\varepsilon \\approx 0.2$. The clip removes the incentive to move the ratio beyond $[1-\\varepsilon, 1+\\varepsilon]$, giving a pessimistic lower bound on the unclipped objective. The authors also describe a variant with an adaptive KL penalty, and compare PPO with TRPO, A2C and others on MuJoCo continuous control and Atari.`,
    whyItMatters: `PPO is simple (first-order optimisation only), robust and sample-efficient enough to be the default policy-optimisation algorithm for years. It is also the algorithm used in the RL stage of **RLHF** for aligning language models, for instance in InstructGPT, usually with a KL penalty towards the initial model.`,
    keyIdeas: [
      'Probability ratio $r_t(\\theta) = \\pi_\\theta / \\pi_{\\theta_{\\text{old}}}$ measures how far the new policy has moved',
      'Clipped surrogate: $\\min(r\\hat A,\\ \\operatorname{clip}(r, 1\\pm\\varepsilon)\\hat A)$ with $\\varepsilon = 0.2$',
      'Several epochs of minibatch SGD on each batch of data, unlike vanilla policy gradient',
      'First-order trust-region-like behaviour, much simpler than TRPO\'s second-order constrained optimisation',
      'Combined objective with a value-function loss and an entropy bonus; advantages from GAE',
    ],
    readingGuide: `The paper is short. Read the first sections in order (background on policy gradients and trust regions, the clipped objective, the adaptive-KL alternative and the algorithm). In the experiments, concentrate on the comparison of the different surrogate objectives and the MuJoCo curves; the Atari results are secondary.`,
    quiz: [
      {
        prompt: 'What does the probability ratio $r_t(\\theta)$ measure?',
        options: [
          'The ratio between value and reward',
          'How much more (or less) likely the action $a_t$ is under the new policy than under the policy that collected the data',
          'The ratio of the learning rate to the step size',
          'The fraction of exploratory actions',
        ],
        correct: 1,
        explanation: `$r_t = \\pi_\\theta(a_t|s_t) / \\pi_{\\theta_{\\text{old}}}(a_t|s_t)$ is an importance-sampling weight. At the start of each iteration it equals 1, and it drifts as the policy is updated.`,
      },
      {
        prompt: 'In the clipped objective, what happens when $\\hat A_t > 0$ and the ratio $r_t$ rises above $1 + \\varepsilon$?',
        options: [
          'The objective keeps increasing linearly with $r_t$',
          'The objective becomes flat in $r_t$, so the gradient vanishes and there is no incentive to increase the probability of that action further',
          'The objective becomes negative',
          'The update is repeated with a smaller learning rate',
        ],
        correct: 1,
        explanation: `For a positive advantage, $\\min(r\\hat A, (1+\\varepsilon)\\hat A) = (1+\\varepsilon)\\hat A$ once $r > 1 + \\varepsilon$: constant in $\\theta$, with zero gradient. The policy is not pushed further from the old one.`,
      },
      {
        prompt: 'What is the main practical advantage of PPO over TRPO?',
        options: [
          'It has stronger theoretical guarantees',
          'It uses only first-order optimisation, which is simpler to implement and compatible with shared parameters, dropout and large networks',
          'It does not need advantages',
          'It is off-policy',
        ],
        correct: 1,
        explanation: `TRPO requires a constrained second-order step (conjugate gradient and a line search). PPO achieves a similar effect with a clipped objective optimised by SGD or Adam, retaining most of the stability.`,
      },
      {
        prompt: 'Why can PPO perform several gradient epochs on the same batch of data?',
        options: [
          'Because it is an off-policy algorithm with a replay buffer',
          'Because the clipping prevents the new policy from moving far from the data-collecting policy, so the importance-sampled objective stays reliable',
          'Because the data are independent',
          'Because it uses a target network',
        ],
        correct: 1,
        explanation: `The surrogate is valid only near $\\pi_{\\theta_{\\text{old}}}$. The clip limits the incentive to leave this region, so the data can be reused for several epochs without destroying the policy. PPO is still an on-policy method: new data are collected after each iteration.`,
      },
      {
        prompt: 'How is PPO related to the alignment of language models?',
        options: [
          'It is used to pretrain the language model with next-token prediction',
          'It is the optimiser in the reinforcement-learning stage of RLHF, maximising a learned reward typically with a KL penalty towards the initial model',
          'It replaces the Transformer architecture',
          'It is used only for image models',
        ],
        correct: 1,
        explanation: `In RLHF (for instance InstructGPT), the policy is the language model, an action is a token, and the reward comes from a reward model trained on human preferences. PPO optimises it while the KL term keeps the model close to its starting point.`,
      },
    ],
  },
];
