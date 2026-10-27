import { codingProblems } from '../content/code';
import { mathPuzzles } from '../content/math';
import { papers } from '../content/papers';
import { dailyIndex, formatDay, isReleased, SECTION_META } from '../lib/daily';
import { completedOnDay, everSolved, resetProgress, streak, useProgress } from '../lib/progress';
import { clearSubmissions } from '../lib/submissions';
import { href } from '../lib/router';
import type { SectionId } from '../types';
import { useState } from 'react';

const SECTIONS: SectionId[] = ['math', 'code', 'papers'];

export function Archive({ today }: { today: number }) {
  const p = useProgress();
  const [confirm, setConfirm] = useState(false);
  const [filter, setFilter] = useState<Partial<Record<SectionId, string>>>({});
  const days = Array.from({ length: 14 }, (_, i) => today - i).filter((d) => d >= 0);

  const titleOf = (s: SectionId, d: number) =>
    s === 'math' ? mathPuzzles[dailyIndex(s, d)].title : s === 'code' ? codingProblems[dailyIndex(s, d)].title : papers[dailyIndex(s, d)].title;
  const idOf = (s: SectionId, d: number) =>
    s === 'math' ? mathPuzzles[dailyIndex(s, d)].id : s === 'code' ? codingProblems[dailyIndex(s, d)].id : papers[dailyIndex(s, d)].id;

  /** Only challenges that have already been released, each with its categories. */
  const library: { s: SectionId; items: { id: string; title: string; sub: string; cats: string[] }[] }[] = [
    {
      s: 'math',
      items: mathPuzzles.filter((x) => isReleased('math', x.id, today)).map((x) => ({ id: x.id, title: x.title, sub: x.difficulty, cats: x.topic.split(' · ') })),
    },
    {
      s: 'code',
      items: codingProblems.filter((x) => isReleased('code', x.id, today)).map((x) => ({ id: x.id, title: x.title, sub: `Rating ${x.rating}`, cats: x.tags })),
    },
    {
      s: 'papers',
      items: papers.filter((x) => isReleased('papers', x.id, today)).map((x) => ({ id: x.id, title: x.title, sub: `${x.authors.split(',')[0]}, ${x.year}`, cats: x.topics })),
    },
  ];

  return (
    <article className="page wide">
      <div className="challenge-heading">
        <div className="kicker">Archive</div>
        <h1>Past editions and the full library</h1>
      </div>

      <section className="panel">
        <h3 className="smallcaps">Streaks</h3>
        <div className="streaks">
          {SECTIONS.map((s) => (
            <div key={s}>
              <strong>{streak(p, s, today)}</strong>
              <span>{SECTION_META[s].label}</span>
            </div>
          ))}
          <div>
            <strong>{streak(p, 'all', today)}</strong>
            <span>All three</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="smallcaps">The last fortnight</h3>
        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th>
              {SECTIONS.map((s) => (
                <th key={s}>{SECTION_META[s].numeral} · {SECTION_META[s].label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d}>
                <td className="date">{formatDay(d, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                {SECTIONS.map((s) => (
                  <td key={s}>
                    <a href={d === today ? href(s) : href(s, idOf(s, d))}>{titleOf(s, d)}</a>
                    {completedOnDay(p, s, d) && <span className="tick" title="Completed on the day"> ✓</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint-text">A tick marks challenges completed on their own day. Opening a past challenge starts a practice attempt, which does not affect streaks.</p>
      </section>

      <section className="library">
        {library.map(({ s, items }) => {
          const counts = new Map<string, number>();
          for (const it of items) for (const c of it.cats) counts.set(c, (counts.get(c) ?? 0) + 1);
          const cats = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
          const active = filter[s] && counts.has(filter[s]!) ? filter[s] : undefined;
          const shown = active ? items.filter((it) => it.cats.includes(active)) : items;
          return (
            <div className="panel" key={s}>
              <h3 className="smallcaps">{SECTION_META[s].numeral} · {SECTION_META[s].label}s</h3>
              {cats.length > 1 && (
                <div className="chips" role="group" aria-label={`${SECTION_META[s].label} categories`}>
                  <button className={`chip ${active ? '' : 'on'}`} onClick={() => setFilter({ ...filter, [s]: undefined })}>All <span>{items.length}</span></button>
                  {cats.map(([c, n]) => (
                    <button key={c} className={`chip ${active === c ? 'on' : ''}`} onClick={() => setFilter({ ...filter, [s]: active === c ? undefined : c })}>
                      {c} <span>{n}</span>
                    </button>
                  ))}
                </div>
              )}
              <ul className="lib-list">
                {shown.map((it) => (
                  <li key={it.id}>
                    <a href={href(s, it.id)}>{it.title}</a>
                    {everSolved(p, s, it.id) && <span className="tick"> ✓</span>}
                    <div className="hint-text">{it.sub}</div>
                    <div className="item-cats">{it.cats.map((c) => <button key={c} className="cat" onClick={() => setFilter({ ...filter, [s]: c })}>{c}</button>)}</div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h3 className="smallcaps">Data</h3>
        {confirm ? (
          <div className="row">
            <span className="hint-text">This erases all progress and saved submissions stored in this browser.</span>
            <button className="btn danger" onClick={() => { resetProgress(); clearSubmissions(); setConfirm(false); }}>Erase</button>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn ghost" onClick={() => setConfirm(true)}>Reset all progress</button>
        )}
      </section>
    </article>
  );
}
