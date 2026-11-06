/* Runs supabase/catalog.sql and supabase/schema.sql on a real Postgres (PGlite, in-process) with stand-ins for
   what Supabase provides (roles, auth.uid(), auth.jwt()), and checks that the scoreboard computed by the database
   matches the TypeScript formula, and that the access rules hold. Run with `npm run test:sql`. */
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { rng } from '../src/lib/rng';
import { dailyId, pools } from '../src/lib/daily';
import { computeStats } from '../src/lib/scoring';
import type { ProgressState } from '../src/lib/progress';
import type { SectionId } from '../src/types';

let failures = 0;
const check = (name: string, ok: boolean, extra = '') => {
  if (!ok) failures++;
  console.log(ok ? 'ok  ' : 'FAIL', name, extra);
};

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated; -- what Supabase does
`);
const catalog = readFileSync(new URL('../supabase/catalog.sql', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
await db.exec(catalog);
await db.exec(schema);
await db.exec(catalog);
await db.exec(schema); // both files must be safe to run again
check('catalog.sql and schema.sql run, and run again', true);
check('the catalog holds the whole library', (await db.query<{ n: number }>('select count(*)::int as n from public.catalog')).rows[0].n === pools.math.length + pools.code.length + pools.papers.length);

// ---- The database formula equals the TypeScript one ----
const TODAY = 11;
const r = rng(2026);
const SECTIONS: SectionId[] = ['math', 'code', 'papers'];
const solvedAttempt = (section: SectionId, id: string, ctx: number | 'practice') => ({
  id, section, solved: true, attempts: 1, updatedAt: 0, ...(ctx === 'practice' ? {} : { day: ctx }), ...(section === 'papers' ? { score: r.int(0, 5), total: 5 } : {}),
});
let mismatches = 0;
for (let it = 0; it < 300; it++) {
  const p: ProgressState = {};
  const density = [0.05, 0.3, 0.7, 1][it % 4];
  for (const s of SECTIONS) for (const item of pools[s]) {
    if (r.next() < density) p[`${s}:${item.id}:practice`] = solvedAttempt(s, item.id, 'practice');
    else if (r.next() < 0.2) p[`${s}:${item.id}:practice`] = { id: item.id, section: s, solved: false, revealed: true, attempts: 2, updatedAt: 0 };
  }
  for (const s of SECTIONS) for (let d = 0; d <= TODAY; d++) if (r.next() < density) p[`${s}:${dailyId(s, d)}:${d}`] = solvedAttempt(s, dailyId(s, d), d);
  const ts = computeStats(p, TODAY);
  const sql = (await db.query<{ s: any }>('select public.compute_stats($1::jsonb, $2) as s', [JSON.stringify(p), TODAY])).rows[0].s;
  let ok = Math.abs(sql.score - ts.score) < 0.11 && sql.day === TODAY;
  for (const s of SECTIONS) {
    const a = sql[s], b = ts[s];
    ok = ok && Math.abs(a.score - b.score) < 0.11 && a.solved === b.solved && a.streak === b.streak && a.last === b.last && a.best === b.best;
    const sortKeys = (o: Record<string, number>) => JSON.stringify(Object.entries(o).sort());
    ok = ok && sortKeys(sql.cats[s]) === sortKeys(ts.cats[s]);
  }
  if (!ok && mismatches++ < 3) console.log('   mismatch', JSON.stringify({ density, sql, ts }).slice(0, 600));
}
check('SQL and TypeScript scoreboards agree on 300 random progress states', mismatches === 0, mismatches ? `${mismatches} differ` : '');

// ---- Access rules and behaviour of the scoreboard ----
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222', C = '33333333-3333-3333-3333-333333333333', D = '44444444-4444-4444-4444-444444444444';
await db.exec(`insert into auth.users values ('${A}'), ('${B}'), ('${C}'), ('${D}')`);
const claims = (uid: string, verified: boolean) => JSON.stringify({ sub: uid, email: 'x@y.z', user_metadata: { email_verified: verified } });
async function as<T>(uid: string, verified: boolean, fn: () => Promise<T>, commit = false): Promise<T> {
  await db.exec('begin');
  try {
    await db.query(`set local role authenticated`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [claims(uid, verified)]);
    const out = await fn();
    await db.exec(commit ? 'commit' : 'rollback');
    return out;
  } catch (e) { await db.exec('rollback'); throw e; }
}
const board = async (uid: string, verified = true) => (await as(uid, verified, () => db.query<{ nickname: string; stats: any; is_me: boolean }>('select * from public.scoreboard()'))).rows;
const save = (uid: string, cols: Record<string, unknown>) => as(uid, true, () => {
  const names = ['user_id', ...Object.keys(cols)];
  return db.query(`insert into public.user_data (${names.join(',')}) values (${names.map((_, i) => `$${i + 1}${typeof cols[names[i]] === 'object' ? '::jsonb' : ''}`).join(',')}) on conflict (user_id) do update set ${Object.keys(cols).map((c) => `${c} = excluded.${c}`).join(', ')}`,
    [uid, ...Object.values(cols).map((v) => (typeof v === 'object' ? JSON.stringify(v) : v))]);
}, true);
const prog = (n: number): ProgressState => Object.fromEntries(pools.math.slice(0, n).map((x) => [`math:${x.id}:practice`, solvedAttempt('math', x.id, 'practice')]));

await save(A, { progress: prog(10) });
await save(B, { progress: prog(3) });
// C signed in once, long ago, and has never come back: only a row written by an earlier session.
await db.query(`insert into public.user_data (user_id, progress) values ($1, $2::jsonb)`, [C, JSON.stringify(prog(6))]);

let rows = await board(A);
check('everybody who ever signed in is listed, without coming back', rows.length === 3, JSON.stringify(rows.map((x) => x.stats.math.solved)));
check('listed best first', rows.map((x) => x.stats.math.solved).join() === '10,6,3');
check('default nickname is anonymous', rows.every((x) => /^Player [0-9a-f]{4}$/.test(x.nickname)), rows.map((x) => x.nickname).join('|'));
check('exactly my own row is flagged is_me', rows.filter((x) => x.is_me).length === 1 && rows.find((x) => x.is_me)!.stats.math.solved === 10);
check('no ids or emails in the output', !Object.keys(rows[0]).some((k) => /id|mail/i.test(k)), Object.keys(rows[0]).join());

// The owner can name players from the dashboard (SQL editor runs as the database owner).
await db.query(`update public.user_data set nickname = 'Carol' where user_id = $1`, [C]);
check('a nickname set from the dashboard shows up', (await board(A)).some((x) => x.nickname === 'Carol'));

// Nicknames: unique ignoring case, and a safe format.
const failsWith = async (fn: () => Promise<unknown>, re: RegExp) => { try { await fn(); return false; } catch (e) { return re.test((e as Error).message); } };
check('nicknames are unique, ignoring case', await failsWith(() => save(B, { nickname: 'carol' }), /unique|duplicate/i));
check('too short a nickname is rejected', await failsWith(() => save(B, { nickname: 'x' }), /nickname_format/));
check('markup in a nickname is rejected', await failsWith(() => save(B, { nickname: '<b>hi</b>' }), /nickname_format/));

// Visibility: hidden players vanish for others but still see themselves.
await save(B, { listed: false });
rows = await board(A);
check('a hidden player disappears for others', rows.length === 2 && rows.every((x) => x.stats.math.solved !== 3));
check('a hidden player still sees their own row', (await board(B)).some((x) => x.is_me && x.stats.math.solved === 3));
await save(B, { listed: true });
check('and can come back', (await board(A)).length === 3);

// Broken progress cannot take the board down, and the other players are still listed.
for (const bad of [{ 'math:x:1': { solved: 'maybe' }, 'papers:y:2': { solved: true, score: 'a', total: 'b' } }, [1, 2, 3], 'text']) {
  await db.query(`update public.user_data set progress = $1::jsonb where user_id = $2`, [JSON.stringify(bad), D]).catch(() => {});
  await db.query(`insert into public.user_data (user_id, progress) values ($1, $2::jsonb) on conflict (user_id) do update set progress = excluded.progress`, [D, JSON.stringify(bad)]);
  rows = await board(A);
  check(`unreadable progress (${JSON.stringify(bad).slice(0, 28)}…) does not break the board`, rows.length >= 3 && rows.every((x) => x.stats && typeof x.stats.score === 'number'), `${rows.length} rows`);
}
await db.query(`delete from public.user_data where user_id = $1`, [D]);

// Who may call what.
check('an unverified email sees an empty scoreboard', (await board(C, false)).length === 0);
check('anonymous visitors cannot call the scoreboard', await failsWith(async () => { await db.exec('begin; set local role anon; select * from public.scoreboard();'); }, /permission denied/i).finally(() => db.exec('rollback')));
check('signed-in users cannot call compute_stats directly', await failsWith(() => as(A, true, () => db.query(`select public.compute_stats('{}'::jsonb)`)), /permission denied/i));
check('the catalog cannot be read through the API', (await as(A, true, () => db.query('select * from public.catalog'))).rows.length === 0);
check('a user cannot read other users\' rows directly', (await as(A, true, () => db.query('select user_id from public.user_data'))).rows.length === 1);
await as(C, true, () => db.query(`update public.user_data set nickname = 'Hijack' where user_id = $1`, [A]), true);
check('nobody can edit another player\'s row', (await db.query<{ nickname: string | null }>('select nickname from public.user_data where user_id = $1', [A])).rows[0].nickname !== 'Hijack');

console.log(failures ? `\n${failures} failure(s)` : '\nAll database checks passed.');
process.exit(failures ? 1 : 0);
