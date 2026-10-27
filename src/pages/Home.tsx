import { codingProblems } from '../content/code';
import { mathPuzzles } from '../content/math';
import { papers } from '../content/papers';
import { dailyIndex, SECTION_META } from '../lib/daily';
import { completedOnDay, getAttempt, streak, useProgress } from '../lib/progress';
import { href } from '../lib/router';
import type { SectionId } from '../types';
import { Badge } from '../components/common';

export function Home({ today }: { today: number }) {
  const p = useProgress();
  const m = mathPuzzles[dailyIndex('math', today)];
  const c = codingProblems[dailyIndex('code', today)];
  const r = papers[dailyIndex('papers', today)];

  const cards: { s: SectionId; title: string; sub: string; detail: string }[] = [
    { s: 'math', title: m.title, sub: m.topic, detail: m.difficulty },
    { s: 'code', title: c.title, sub: c.tags.join(', '), detail: `Rating ${c.rating}` },
    { s: 'papers', title: r.title, sub: `${r.authors.split(',')[0]}${r.authors.includes(',') ? ' et al.' : ''}, ${r.year}`, detail: `${r.readingMinutes} min read` },
  ];
  const done = cards.filter((x) => completedOnDay(p, x.s, today)).length;
  const full = streak(p, 'all', today);

  return (
    <div className="home">
      <section className="lede">
        <p>
          Each day brings three short exercises for the scientifically minded: a problem that rewards insight over computation, an algorithmic task in the style of a competitive-programming round, and a landmark paper accompanied by a comprehension quiz.
        </p>
        <div className="lede-stats">
          <div>
            <strong>{done}/3</strong>
            <span>completed today</span>
          </div>
          <div>
            <strong>{full}</strong>
            <span>day streak (all three)</span>
          </div>
        </div>
      </section>

      <section className="cards">
        {cards.map(({ s, title, sub, detail }) => {
          const meta = SECTION_META[s];
          const doneToday = completedOnDay(p, s, today);
          const id = s === 'math' ? m.id : s === 'code' ? c.id : r.id;
          const a = getAttempt(s, id, today);
          const st = streak(p, s, today);
          let status = <Badge tone="muted">Not started</Badge>;
          if (doneToday) status = <Badge tone="ok">{s === 'papers' && a?.total ? `Completed · ${a.score}/${a.total}` : 'Solved'}</Badge>;
          else if (a?.revealed) status = <Badge tone="bad">Solution revealed</Badge>;
          else if (a && a.attempts > 0) status = <Badge tone="accent">In progress</Badge>;
          return (
            <a key={s} className="card" href={href(s)}>
              <div className="card-top">
                <span className="numeral big">{meta.numeral}</span>
                <span className="card-label">{meta.label} of the day</span>
              </div>
              <h2>{title}</h2>
              <p className="card-sub">{sub}</p>
              <p className="card-blurb">{meta.blurb}</p>
              <div className="card-foot">
                <span>{detail}</span>
                {status}
              </div>
              <div className="card-streak">Streak: {st} {st === 1 ? 'day' : 'days'}</div>
            </a>
          );
        })}
      </section>
    </div>
  );
}
