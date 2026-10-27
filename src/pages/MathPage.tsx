import { useState } from 'react';
import { mathPuzzles } from '../content/math';
import { dailyIndex } from '../lib/daily';
import { getAttempt, updateAttempt, useProgress, type Ctx } from '../lib/progress';
import { isCorrect, parseNumeric } from '../lib/answer';
import { Rich } from '../components/Rich';
import { Badge, ChallengeHeading } from '../components/common';

export function MathPage({ today, id }: { today: number; id?: string }) {
  useProgress();
  const daily = mathPuzzles[dailyIndex('math', today)];
  const puzzle = id ? mathPuzzles.find((x) => x.id === id)! : daily;
  const isDaily = !id || id === daily.id;
  const ctx: Ctx = isDaily ? today : 'practice';
  const a = getAttempt('math', puzzle.id, ctx);

  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'bad' | 'muted'; text: string } | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);

  const solved = !!a?.solved;
  const revealed = !!a?.revealed;
  const hintsUsed = a?.hintsUsed ?? 0;
  const finished = solved || revealed;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseNumeric(value);
    if (v === null) {
      setFeedback({ tone: 'muted', text: 'Please enter a number, a decimal or a fraction such as 3/7.' });
      return;
    }
    const ok = isCorrect(v, puzzle.answer, puzzle.tolerance);
    updateAttempt('math', puzzle.id, ctx, { attempts: (a?.attempts ?? 0) + 1, solved: ok && !revealed });
    setFeedback(ok ? { tone: 'ok', text: revealed ? 'Correct, although the solution had already been revealed.' : 'Correct. Well reasoned.' } : { tone: 'bad', text: 'Not quite. Reconsider your argument and try again.' });
  }

  return (
    <article className="page">
      <ChallengeHeading
        section="math"
        isDaily={isDaily}
        today={today}
        title={puzzle.title}
        meta={
          <>
            <Badge>{puzzle.topic}</Badge>
            <Badge>{puzzle.difficulty}</Badge>
            {solved && <Badge tone="ok">Solved</Badge>}
            {revealed && !solved && <Badge tone="bad">Solution revealed</Badge>}
          </>
        }
      />

      <section className="panel statement">
        <h3 className="smallcaps">Statement</h3>
        <Rich text={puzzle.statement} />
      </section>

      <section className="panel">
        <h3 className="smallcaps">Your answer</h3>
        {solved ? (
          <p className="feedback ok">Solved in {a!.attempts} {a!.attempts === 1 ? 'attempt' : 'attempts'}{hintsUsed ? `, with ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}` : ''}.</p>
        ) : (
          <form className="answer-form" onSubmit={submit}>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 42 or 3/7" aria-label="Answer" autoComplete="off" />
            <button className="btn primary" type="submit">Submit</button>
            <span className="hint-text">Expected: {puzzle.answerFormat}.</span>
          </form>
        )}
        {feedback && !solved && <p className={`feedback ${feedback.tone}`}>{feedback.text}</p>}
        {(a?.attempts ?? 0) > 0 && !solved && <p className="hint-text">Attempts so far: {a!.attempts}</p>}
      </section>

      <section className="panel">
        <h3 className="smallcaps">Hints</h3>
        {puzzle.hints.slice(0, finished ? puzzle.hints.length : hintsUsed).map((h, i) => (
          <div key={i} className="hint">
            <span className="hint-n">Hint {i + 1}</span>
            <Rich text={h} />
          </div>
        ))}
        <div className="row">
          {!finished && hintsUsed < puzzle.hints.length && (
            <button className="btn" onClick={() => updateAttempt('math', puzzle.id, ctx, { hintsUsed: hintsUsed + 1 })}>
              Reveal hint {hintsUsed + 1} of {puzzle.hints.length}
            </button>
          )}
          {!finished &&
            (confirmReveal ? (
              <>
                <span className="hint-text">Revealing the solution forfeits today’s credit.</span>
                <button className="btn danger" onClick={() => updateAttempt('math', puzzle.id, ctx, { revealed: true })}>Reveal anyway</button>
                <button className="btn ghost" onClick={() => setConfirmReveal(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn ghost" onClick={() => setConfirmReveal(true)}>Show solution</button>
            ))}
        </div>
      </section>

      {finished && (
        <section className="panel solution">
          <h3 className="smallcaps">Solution</h3>
          <p className="answer-line">
            Answer: <strong>{puzzle.answerDisplay}</strong>
          </p>
          <Rich text={puzzle.solution} />
        </section>
      )}
    </article>
  );
}
