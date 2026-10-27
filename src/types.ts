export type SectionId = 'math' | 'code' | 'papers';

export type Difficulty = 'Introductory' | 'Intermediate' | 'Advanced';

/** Text fields use a light markup: blank line = paragraph, "- " = bullet,
 *  `code`, **bold**, *italic*, $math$. See components/Rich.tsx. */
export type RichText = string;

export interface MathPuzzle {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  statement: RichText;
  /** Shown under the input, e.g. "an integer" or "an exact fraction such as 3/7". */
  answerFormat: string;
  /** Numeric value of the correct answer. */
  answer: number;
  /** Relative tolerance; 0 means exact integer comparison. */
  tolerance: number;
  /** Canonical display form of the answer, e.g. "13/27". */
  answerDisplay: string;
  hints: RichText[];
  solution: RichText;
}

export interface TestCase {
  input: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  /** Codeforces-style difficulty rating. */
  rating: number;
  tags: string[];
  timeLimitMs: number;
  legend: RichText;
  inputSpec: RichText;
  outputSpec: RichText;
  samples: { input: string; output: string; note?: RichText }[];
  /** Hidden tests, generated deterministically (seeded PRNG). */
  generateTests: () => TestCase[];
  /** Reference solution, used to compute expected output. */
  reference: (input: string) => string;
  /** Returns null if accepted, otherwise a short reason. Defaults to token-wise equality. */
  check?: (input: string, output: string, expected: string) => string | null;
  editorial: RichText;
}

export interface QuizQuestion {
  prompt: RichText;
  options: string[];
  correct: number;
  explanation: RichText;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  url: string;
  field: string;
  /** Categories used to browse the archive; the first is the broadest. */
  topics: string[];
  readingMinutes: number;
  summary: RichText;
  whyItMatters: RichText;
  keyIdeas: string[];
  readingGuide: RichText;
  quiz: QuizQuestion[];
}
