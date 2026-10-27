# The Daily Rigor

A daily exercise in mathematics, algorithms and scholarship. Every day it publishes three challenges:

1. **Problem**: a tricky mathematical puzzle (probability, combinatorics, binary or ternary encodings and the like) with a single verifiable numerical answer, progressive hints and a full solution.
2. **Algorithm**: a Codeforces-style task with a statement, examples and hidden tests (including maximal inputs). It is judged in the browser under a time limit and comes with an editorial.
3. **Paper**: a landmark but readable paper, with a summary, key ideas, a reading guide and a five-question comprehension quiz.

## Running locally

```bash
npm install
npm run dev            # development server
npm run build          # production build → dist/ (deploy to any static host)
npm run build:single   # one self-contained HTML file → dist-single/index.html
npm run judge          # C++ judge server on :8787 (needs g++); run it next to `npm run dev`
npm run docker         # everything in one container (app + C++ judge) on http://localhost:8787
npm run test:content   # checks reference solutions (brute force), samples, puzzle answers (Monte Carlo), KaTeX
```

## Structure

```
src/
  content/        math.ts · code.ts · papers.ts   ← all challenge content (add items here)
  lib/
    daily.ts      day numbering and daily rotation (pool cycling with per-section offsets)
    progress.ts   ProgressStore interface + localStorage implementation, streaks
    judge.ts      Web Worker sandbox, verdicts (AC/WA/TLE/RE/CE), custom checkers
    answer.ts     numeric/fraction answer parsing with tolerance
    rng.ts        seeded PRNG for reproducible hidden tests
  pages/          Home · MathPage · CodePage · PaperPage · Archive
  components/     Rich (light markup + KaTeX), shared UI
scripts/verify-content.ts
```

See `DEPLOY.md` for putting it online for friends: Google/GitHub sign-in, invitation list and per-user cloud progress through Supabase (`supabase/schema.sql`).

### C++ judging

The Algorithm page has a JavaScript/C++20 selector. JavaScript runs in a Web Worker; C++ is sent to `server/judge-server.mjs`, which compiles with `g++ -O2 -std=c++20` and runs each test with a wall-clock limit (Vite proxies `/api` to it in dev; the single-file build talks to `http://localhost:8787`). Reference solutions, checkers and hidden tests still live on the client. For a public deployment, move them behind the server.

### Adding content

- **Puzzle**: append a `MathPuzzle` to `src/content/math.ts`. Set `tolerance: 0` for exact integers, or a relative tolerance for real values. Fractions such as `13/27` are accepted as input.
- **Coding problem**: append a `CodingProblem` with `reference`, `generateTests` (seeded) and an optional `check` for problems with many valid answers. Add a brute-force cross-check to `scripts/verify-content.ts`.
- **Paper**: append a `Paper`. Write `correct` against the original option order; options are shuffled deterministically at display time.

Text fields support paragraphs (blank line), `- ` bullets, `` `code` ``, `**bold**`, `*italic*`, `$inline$` and `$$display$$` LaTeX.

## Roadmap towards a public, multi-user version

The MVP keeps everything client-side. The seams for the next step are already in place:

| Concern | Now | Next |
|---|---|---|
| Users & progress | `localProgressStore` and `localSubmissionStore` (localStorage; every submission is kept with its code) | Implement `ProgressStore` against an API (e.g. Supabase/Postgres) and call `setProgressStore` after login |
| Daily schedule | `dailyIndex()`: deterministic cycling | Server-side schedule table (`date → item id`), so content can be curated and never repeats |
| Judging | Web Worker in the browser; references and tests shipped to the client | Server-side sandbox (e.g. Judge0 or isolate) with hidden tests stored on the server; more languages (C++, Python) |
| Puzzle answers | Checked client-side | Verify on the server so answers are not in the bundle |
| Content | TypeScript files | Database or CMS with an editorial workflow; leaderboards per day |
| Routing | Hash router | `react-router` with shareable URLs per date (`/2026-10-25/problem`) |
