-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run. It is safe to run again
-- (for example after an update): it only adds what is missing. Also run supabase/catalog.sql (before or after),
-- which tells the scoreboard what the library contains.

-- 1. Optional invitation list, used only if you switch to invite-only mode (see section 3).
--    Nobody can read or change this table through the API (RLS on, no policies);
--    you edit it from the dashboard (Table Editor) or this SQL editor.
create table if not exists public.allowed_emails (
  email text primary key check (email = lower(email))
);
alter table public.allowed_emails enable row level security;

-- 2. One row of data per user: progress, streaks and submissions.
create table if not exists public.user_data (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  progress    jsonb not null default '{}'::jsonb,
  submissions jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table public.user_data enable row level security;

-- 2b. Scoreboard settings. The nickname is what other players see (never the email), and `listed` lets a player
--     hide from the board. Everybody is listed by default, even before coming back to the site.
alter table public.user_data add column if not exists nickname text;
alter table public.user_data add column if not exists listed   boolean not null default true;
alter table public.user_data drop constraint if exists user_data_nickname_format;
alter table public.user_data add constraint user_data_nickname_format
  check (nickname is null or nickname ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$');
create unique index if not exists user_data_nickname_key on public.user_data (lower(nickname)) where nickname is not null;

-- 3. "May I enter?" By default every account whose email has been verified by Google/GitHub may enter.
create or replace function public.am_i_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false);
$$;

-- Invite-only mode: run this instead to also require the email to be in allowed_emails.
-- create or replace function public.am_i_allowed()
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false)
--      and exists (select 1 from public.allowed_emails where email = lower(auth.jwt() ->> 'email'));
-- $$;
revoke all on function public.am_i_allowed() from public, anon;
grant execute on function public.am_i_allowed() to authenticated;

-- 4. A user can read and write only their own row, and only while allowed in.
drop policy if exists "read own data"   on public.user_data;
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
create policy "read own data"   on public.user_data for select to authenticated
  using ((select auth.uid()) = user_id and public.am_i_allowed());
create policy "insert own data" on public.user_data for insert to authenticated
  with check ((select auth.uid()) = user_id and public.am_i_allowed());
create policy "update own data" on public.user_data for update to authenticated
  using ((select auth.uid()) = user_id and public.am_i_allowed())
  with check ((select auth.uid()) = user_id and public.am_i_allowed());

-- 4b. The scoreboard is computed here, from each player's saved progress and the library in `catalog` (see
--     supabase/catalog.sql, generated from the app's content), with the same formula as src/lib/scoring.ts.
--     Computing it on the server covers everybody, even players who have not come back since, and keeps their
--     numbers consistent. For each feature it returns the score (0-1000), the items solved, the current run of
--     daily challenges completed on their own day (and the day it ended), the longest run, and the solved items
--     per category. If someone's progress cannot be read (corrupt, or absurdly large), they are left out
--     instead of breaking the board for everybody.
create or replace function public.compute_stats(progress jsonb, today int default null)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  d_today int := coalesce(today, timezone(public.day_zone(), now())::date - public.launch_epoch());
  sec text;
  ids text[];
  n int;
  got numeric;
  mx numeric;
  solved int;
  cats jsonb;
  all_cats jsonb := '{}'::jsonb;
  feats jsonb := '{}'::jsonb;
  scores numeric[] := '{}';
  fscore numeric;
  done boolean;
  d int;
  run int;
  last_run int;
  last_day int;
  best int;
begin
  if progress is null or jsonb_typeof(progress) <> 'object' or pg_column_size(progress) > 10000000 then
    return null;
  end if;
  foreach sec in array array['math', 'code', 'papers'] loop
    -- Earned value: 1 per item for problems and algorithms, quiz correctness for papers (best attempt).
    select coalesce(sum(c.value), 0), coalesce(sum(c.value * coalesce(s.ratio, 0)), 0), count(s.id)::int
      into mx, got, solved
      from public.catalog c
      left join (
        select split_part(k, ':', 2) as id,
               case when sec = 'papers'
                    then coalesce(max(least(1, greatest(0, (v ->> 'score')::numeric / (v ->> 'total')::numeric)))
                                  filter (where (v ->> 'total')::numeric > 0), 0)
                    else 1 end as ratio
          from jsonb_each(progress) as t(k, v)
         where split_part(k, ':', 1) = sec and v ->> 'solved' = 'true'
         group by 1
      ) s on s.id = c.item_id
     where c.section = sec;
    fscore := case when mx > 0 then round(1000 * got / mx, 1) else 0 end;

    select coalesce(jsonb_object_agg(cat, cnt), '{}'::jsonb) into cats from (
      select cat, count(*) as cnt
        from public.catalog c
        join (select distinct split_part(k, ':', 2) as id
                from jsonb_each(progress) as t(k, v)
               where split_part(k, ':', 1) = sec and v ->> 'solved' = 'true') s on s.id = c.item_id,
        unnest(c.cats) as cat
       where c.section = sec
       group by cat
    ) x;

    -- Streaks over the daily rotation: day d shows the item at position d mod n, and counts if it was solved on day d.
    select coalesce(array_agg(item_id order by pos), '{}') into ids from public.catalog where section = sec;
    n := coalesce(array_length(ids, 1), 0);
    run := 0; last_run := 0; last_day := -1; best := 0;
    if n > 0 then
      for d in 0..d_today loop
        done := coalesce((progress -> (sec || ':' || ids[(d % n) + 1] || ':' || d)) ->> 'solved' = 'true', false);
        if done then
          run := run + 1; last_run := run; last_day := d; best := greatest(best, run);
        else
          run := 0;
        end if;
      end loop;
    end if;

    feats := feats || jsonb_build_object(sec, jsonb_build_object('score', fscore, 'solved', solved, 'streak', last_run, 'last', last_day, 'best', best));
    all_cats := all_cats || jsonb_build_object(sec, cats);
    scores := scores || fscore;
  end loop;
  return jsonb_build_object('v', 1, 'score', round((scores[1] + scores[2] + scores[3]) / 3, 1), 'day', d_today)
         || feats || jsonb_build_object('cats', all_cats);
exception when others then
  return null; -- progress with unexpected contents
end;
$$;
revoke all on function public.compute_stats(jsonb, int) from public, anon, authenticated;

-- Every listed player's nickname and stats, plus your own row (flagged `is_me`, even if you hide). It never exposes
-- ids or emails. It runs with the owner's rights because the policies above only let you read your own row.
create or replace function public.scoreboard()
returns table (nickname text, stats jsonb, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  select x.nickname, x.stats, x.is_me
  from (
    select coalesce(u.nickname, 'Player ' || substr(md5(u.user_id::text), 1, 4)) as nickname,
           public.compute_stats(u.progress) as stats,
           u.user_id = (select auth.uid()) as is_me
    from public.user_data u
    where public.am_i_allowed()
      and (u.listed or u.user_id = (select auth.uid()))
  ) x
  where x.stats is not null
  order by (x.stats ->> 'score')::numeric desc
  limit 500;
$$;
revoke all on function public.scoreboard() from public, anon;
grant execute on function public.scoreboard() to authenticated;

-- Clean-up of an earlier design, where each browser uploaded its own stats.
drop trigger if exists user_data_sanitize on public.user_data;
drop function if exists public.sanitize_stats();
alter table public.user_data drop column if exists stats;

-- 5. Invite-only mode only: invite people (lower-case addresses of their Google / GitHub accounts):
-- insert into public.allowed_emails (email) values ('you@gmail.com'), ('friend@gmail.com');
