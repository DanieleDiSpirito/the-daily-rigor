import { useMemo, useState } from 'react';
import { papers } from '../content/papers';
import { dailyIndex } from '../lib/daily';
import { getAttempt, updateAttempt, useProgress, type Ctx } from '../lib/progress';
import { Rich, RichInline } from '../components/Rich';
import { Badge, ChallengeHeading } from '../components/common';
import { rng } from '../lib/rng';
import type { Paper, QuizQuestion } from '../types';

/** Deterministic per-question shuffle so the correct option is not always in the same place. */
function shuffled(paper: Paper): QuizQuestion[] {
  return paper.quiz.map((q, qi) => {
    let seed = qi + 1;
    for (const ch of paper.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const r = rng(seed);
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = r.int(0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
  });
}

export function PaperPage({ today, id }: { today: number; id?: string }) {
  useProgress();
  const daily = papers[dailyIndex('papers', today)];
  const paper = id ? papers.find((x) => x.id === id)! : daily;
  const isDaily = !id || id === daily.id;
  const ctx: Ctx = isDaily ? today : 'practice';
  const a = getAttempt('papers', paper.id, ctx);
  const quiz = useMemo(() => shuffled(paper), [paper]);

  const [answers, setAnswers] = useState<(number | null)[]>(() => a?.answers ?? quiz.map(() => null));
  const [submitted, setSubmitted] = useState<boolean>(!!a?.solved);
  const n = quiz.length;
  const score = answers.reduce<number>((s, x, i) => s + (x === quiz[i].correct ? 1 : 0), 0);
  const complete = answers.every((x) => x !== null);

  function submit() {
    setSubmitted(true);
    // The first submission is the one that counts for the daily record.
    if (!a?.solved) updateAttempt('papers', paper.id, ctx, { solved: true, score, total: n, answers: answers as number[], attempts: 1 });
  }

  return (
    <article className="page">
      <ChallengeHeading
        section="papers"
        isDaily={isDaily}
        today={today}
        title={paper.title}
        meta={
          <>
            <Badge>{paper.field}</Badge>
            {paper.topics.map((t) => <Badge key={t} tone="muted">{t}</Badge>)}
            <Badge>{paper.year}</Badge>
            <Badge>≈ {paper.readingMinutes} min read</Badge>
            {a?.solved && <Badge tone="ok">Quiz completed · {a.score}/{a.total}</Badge>}
          </>
        }
      />

      <section className="panel paper-meta">
        <p className="authors">{paper.authors}</p>
        <p className="venue">{paper.venue}</p>
        <a className="btn" href={paper.url} target="_blank" rel="noreferrer">
          Read the original ↗
        </a>
      </section>

      <section className="panel">
        <h3 className="smallcaps">Summary</h3>
        <Rich text={paper.summary} />
        <h3 className="smallcaps">Why it matters</h3>
        <Rich text={paper.whyItMatters} />
        <h3 className="smallcaps">Key ideas</h3>
        <ul className="ideas">
          {paper.keyIdeas.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <h3 className="smallcaps">How to read it</h3>
        <Rich text={paper.readingGuide} />
      </section>

      <section className="panel quiz">
        <h3 className="smallcaps">Comprehension quiz</h3>
        <p className="hint-text">Read the paper, or at least the summary above, before answering. Your first submission is recorded.</p>
        <ol className="questions">
          {quiz.map((q, qi) => {
            const chosen = answers[qi];
            return (
              <li key={qi} className="question">
                <div className="q-prompt">
                  <RichInline text={q.prompt} />
                </div>
                <div className="options">
                  {q.options.map((o, oi) => {
                    let cls = 'option';
                    if (chosen === oi) cls += ' chosen';
                    if (submitted && oi === q.correct) cls += ' correct';
                    if (submitted && chosen === oi && oi !== q.correct) cls += ' wrong';
                    return (
                      <label key={oi} className={cls}>
                        <input type="radio" name={`q${qi}`} disabled={submitted} checked={chosen === oi} onChange={() => setAnswers(answers.map((x, i) => (i === qi ? oi : x)))} />
                        <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <RichInline text={o} />
                      </label>
                    );
                  })}
                </div>
                {submitted && (
                  <div className={`explanation ${chosen === q.correct ? 'ok' : 'bad'}`}>
                    <strong>{chosen === q.correct ? 'Correct.' : `Incorrect; the answer is ${String.fromCharCode(65 + q.correct)}.`}</strong> <RichInline text={q.explanation} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {!submitted ? (
          <div className="row">
            <button className="btn primary" disabled={!complete} onClick={submit}>
              Submit answers
            </button>
            {!complete && <span className="hint-text">{answers.filter((x) => x === null).length} question(s) unanswered.</span>}
          </div>
        ) : (
          <div className="row">
            <p className={`feedback ${score === n ? 'ok' : score >= n / 2 ? 'muted' : 'bad'}`}>
              Score: {score}/{n}. {score === n ? 'A thorough reading.' : score >= n / 2 ? 'A solid grasp; revisit the questions you missed.' : 'Consider a second reading of the key sections.'}
            </p>
            <button className="btn ghost" onClick={() => { setSubmitted(false); setAnswers(quiz.map(() => null)); }}>
              Retake (not recorded)
            </button>
          </div>
        )}
      </section>
    </article>
  );
}
