import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { authEnabled, leaveGuest, supabase, type AuthState } from '../lib/auth';
import { syncNow } from '../lib/cloud';
import { SECTION_META } from '../lib/daily';
import { currentStreak, DIFFICULTY_WEIGHT, type FeatureStats, type Stats } from '../lib/scoring';
import type { SectionId } from '../types';

const SECTIONS: SectionId[] = ['math', 'code', 'papers'];

type Metric = 'score' | 'solved' | 'streak' | 'best';
const METRICS: { key: Metric; label: string; title: string }[] = [
  { key: 'score', label: 'Score', title: 'The share of the maximum possible for this feature, from 0 to 1000' },
  { key: 'solved', label: 'Solved', title: 'Items completed' },
  { key: 'streak', label: 'Streak', title: 'Days in a row completed on their own day, up to today' },
  { key: 'best', label: 'Best', title: 'Longest streak ever' },
];
type SortKey = 'total' | `${SectionId}.${Metric}`;

interface Row { nickname: string; stats: Stats; is_me: boolean }

const valid = (r: Row) => !!r.stats && SECTIONS.every((s) => typeof r.stats[s]?.score === 'number');

function value(r: Row, key: SortKey, today: number): number {
  if (key === 'total') return r.stats.score;
  const [section, metric] = key.split('.') as [SectionId, Metric];
  const f: FeatureStats = r.stats[section];
  return metric === 'streak' ? currentStreak(f, today) : f[metric];
}

const NICKNAME_HELP = 'Use 2–20 letters, digits, spaces, dots, dashes or underscores, starting with a letter or digit.';

export function Scoreboard({ today, auth }: { today: number; auth: AuthState }) {
  return (
    <article className="page wide">
      <div className="challenge-heading">
        <div className="kicker">Scoreboard</div>
        <h1>How everyone is doing</h1>
      </div>
      {!authEnabled ? (
        <section className="panel"><p>The scoreboard needs accounts, and this copy of the site runs without them.</p></section>
      ) : auth.status === 'guest' ? (
        <section className="panel">
          <p>The scoreboard is for signed-in players: your progress is saved in your account and shows up here under a nickname you choose.</p>
          <div className="row"><button className="btn primary" onClick={leaveGuest}>Sign in</button></div>
          <p className="hint-text">Signing in starts from a clean slate: progress saved as a guest is discarded.</p>
        </section>
      ) : auth.status === 'in' ? (
        <Board today={today} uid={auth.user.id} />
      ) : null}
    </article>
  );
}

function Board({ today, uid }: { today: number; uid: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'total', dir: -1 });
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    await syncNow(); // so that your own row reflects what you have just done
    const { data, error: err } = await supabase.rpc('scoreboard');
    if (err) {
      setError(err.code === 'PGRST202' || /scoreboard/.test(err.message) ? 'The scoreboard is not set up yet: the database has not been updated with the latest schema.' : 'Could not load the scoreboard. Try again in a moment.');
      return;
    }
    setRows(((data ?? []) as Row[]).filter(valid));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const ranked = useMemo(() => {
    if (!rows) return [];
    const totals = rows.map((r) => r.stats.score);
    const withRank = rows.map((r, i) => ({ r, key: `${i}:${r.nickname}`, rank: 1 + totals.filter((t) => t > r.stats.score).length }));
    return withRank.sort((a, b) => (value(b.r, sort.key, today) - value(a.r, sort.key, today)) * -sort.dir || b.r.stats.score - a.r.stats.score || a.r.nickname.localeCompare(b.r.nickname));
  }, [rows, sort, today]);

  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (-s.dir as 1 | -1) } : { key, dir: -1 }));
  const Head = ({ k, children, title, className, rowSpan }: { k: SortKey; children: string; title?: string; className?: string; rowSpan?: number }) => (
    <th rowSpan={rowSpan} className={`num ${className ?? ''}`} aria-sort={sort.key === k ? (sort.dir === -1 ? 'descending' : 'ascending') : 'none'} title={title}>
      <button className={sort.key === k ? 'on' : ''} onClick={() => sortBy(k)}>
        {children}
        <span aria-hidden>{sort.key === k ? (sort.dir === -1 ? '▾' : '▴') : ''}</span>
      </button>
    </th>
  );

  return (
    <>
      <Profile uid={uid} onChange={load} />

      <section className="panel">
        <div className="row" style={{ marginTop: 0, justifyContent: 'space-between' }}>
          <h3 className="smallcaps" style={{ margin: 0 }}>Players{rows ? ` · ${rows.length}` : ''}</h3>
          <button className="btn ghost" onClick={() => void load()}>Refresh</button>
        </div>
        {error && <p className="feedback bad">{error}</p>}
        {!rows && !error && <p className="hint-text">Loading…</p>}
        {rows && rows.length === 0 && <p className="hint-text">Nobody is on the board yet. Complete a challenge and come back.</p>}
        {rows && rows.length > 0 && (
          <div className="board-wrap">
            <table className="ledger board">
              <thead>
                <tr className="group">
                  <th rowSpan={2}>#</th>
                  <th rowSpan={2} style={{ textAlign: 'left' }}>Player</th>
                  <Head k="total" rowSpan={2} title="The mean of the three feature scores, from 0 to 1000">Score</Head>
                  {SECTIONS.map((s) => <th key={s} colSpan={4} className="edge">{SECTION_META[s].numeral} · {SECTION_META[s].label}</th>)}
                </tr>
                <tr>
                  {SECTIONS.flatMap((s) => METRICS.map((m, i) => <Head key={`${s}.${m.key}`} k={`${s}.${m.key}`} title={m.title} className={i === 0 ? 'edge' : ''}>{m.label}</Head>))}
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ r, key, rank }) => (
                  <Fragment key={key}>
                    <tr className={`player ${r.is_me ? 'me' : ''}`} onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
                      <td className="rank">{rank}</td>
                      <td className="name">{r.nickname}{r.is_me && <span className="you">you</span>}</td>
                      <td className="num total">{Math.round(r.stats.score)}</td>
                      {SECTIONS.flatMap((s) => METRICS.map((m, i) => (
                        <td key={`${s}.${m.key}`} className={`num ${i === 0 ? 'edge' : ''}`}>{Math.round(value(r, `${s}.${m.key}`, today))}</td>
                      )))}
                    </tr>
                    {open === key && (
                      <tr className="detail">
                        <td colSpan={3 + SECTIONS.length * METRICS.length}>
                          <div className="cat-grid">
                            {SECTIONS.map((s) => {
                              const cats = Object.entries(r.stats.cats?.[s] ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
                              return (
                                <div key={s}>
                                  <h4>Solved by category · {SECTION_META[s].label}</h4>
                                  <p>{cats.length ? cats.map(([c, n], i) => <Fragment key={c}>{i > 0 && ' · '}{c} <b>{n}</b></Fragment>) : 'Nothing yet'}</p>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="hint-text">Click a column to sort by it (again to reverse), and a player to see what they have solved in each category.</p>
      </section>

      <section className="panel">
        <h3 className="smallcaps">How the score works</h3>
        <p>
          Each feature is measured in its own unit: for <strong>Problems</strong>, the puzzles you solve weighted by difficulty (Introductory {DIFFICULTY_WEIGHT.Introductory}, Intermediate {DIFFICULTY_WEIGHT.Intermediate},
          Advanced {DIFFICULTY_WEIGHT.Advanced}); for <strong>Algorithms</strong>, the sum of the ratings of the problems you solve; for <strong>Papers</strong>, the reading time of every paper you complete multiplied by how
          well you did in its quiz. Each total is then divided by the most it could ever be, over the whole library, and scaled to 1000. The overall score is the mean of the three, so every feature weighs exactly a third.
        </p>
        <p className="hint-text">
          The streak is counted on daily challenges completed on their own day, and a streak ends when a day is missed. The numbers are reported by each player&rsquo;s browser and are not verified, so treat the board as friendly rather than official.
        </p>
      </section>
    </>
  );
}

function Profile({ uid, onChange }: { uid: string; onChange: () => void }) {
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState('');
  const [listed, setListed] = useState(true);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = (await supabase?.from('user_data').select('nickname, listed').eq('user_id', uid).maybeSingle()) ?? {};
      if (!alive) return;
      setNickname(data?.nickname ?? '');
      setSaved(data?.nickname ?? '');
      setListed(data?.listed ?? true);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [uid]);

  const save = async (patch: { nickname?: string | null; listed?: boolean }) => {
    const { error } = (await supabase?.from('user_data').upsert({ user_id: uid, ...patch })) ?? {};
    if (!error) { setMsg({ tone: 'ok', text: 'Saved.' }); onChange(); return true; }
    setMsg({ tone: 'bad', text: error.code === '23505' ? 'That nickname is taken.' : error.code === '23514' ? NICKNAME_HELP : 'Could not save. Try again in a moment.' });
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = nickname.trim();
    if (next && !/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$/.test(next)) { setMsg({ tone: 'bad', text: NICKNAME_HELP }); return; }
    if (await save({ nickname: next || null })) { setSaved(next); setNickname(next); }
  };

  return (
    <section className="panel">
      <h3 className="smallcaps">Your profile</h3>
      <form className="profile-form" onSubmit={submit}>
        <input type="text" value={nickname} onChange={(e) => { setNickname(e.target.value); setMsg(null); }} placeholder="A nickname" aria-label="Nickname" maxLength={20} disabled={!ready} autoComplete="off" />
        <button className="btn primary" type="submit" disabled={!ready || nickname.trim() === saved}>Save</button>
        <label>
          <input type="checkbox" checked={listed} disabled={!ready} onChange={async (e) => { const v = e.target.checked; setListed(v); if (!(await save({ listed: v }))) setListed(!v); }} />
          Show me on the scoreboard
        </label>
      </form>
      {msg && <p className={`feedback ${msg.tone}`}>{msg.text}</p>}
      <p className="hint-text">
        Other players see only this nickname, never your name or email. Until you choose one you appear as an anonymous &ldquo;Player&rdquo; with four letters or digits. Leave the field empty to go back to that.
      </p>
    </section>
  );
}
