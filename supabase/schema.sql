-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run. It is safe to run again
-- (for example after an update): it only adds what is missing.

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

-- 2b. Scoreboard columns. `stats` is computed by the app (see src/lib/scoring.ts); the nickname is what other
--     players see (never the email), and `listed` lets a player hide from the board.
alter table public.user_data add column if not exists stats    jsonb;
alter table public.user_data add column if not exists nickname text;
alter table public.user_data add column if not exists listed   boolean not null default true;
alter table public.user_data drop constraint if exists user_data_nickname_format;
alter table public.user_data add constraint user_data_nickname_format
  check (nickname is null or nickname ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$');
create unique index if not exists user_data_nickname_key on public.user_data (lower(nickname)) where nickname is not null;

-- Sanity bounds on the uploaded stats, using the server's date. This is NOT anti-cheat (the numbers come from the
-- user's own browser, so a determined player can still invent plausible ones); it only rejects the absurd. Invalid
-- stats are dropped instead of raising an error, so that a problem here can never block saving the progress itself.
create or replace function public.sanitize_stats()
returns trigger
language plpgsql
as $$
declare
  max_day int := (current_date - date '2026-10-26') + 2; -- days since launch, with slack for time zones
  f text;
  x jsonb;
  ok boolean := true;
begin
  if new.stats is null then return new; end if;
  begin
    if jsonb_typeof(new.stats) <> 'object' or coalesce((new.stats ->> 'score')::numeric, -1) not between 0 and 1000 then
      ok := false;
    end if;
    foreach f in array array['math', 'code', 'papers'] loop
      x := new.stats -> f;
      if jsonb_typeof(x) is distinct from 'object'
         or coalesce((x ->> 'score')::numeric, -1) not between 0 and 1000
         or coalesce((x ->> 'solved')::int, -1) not between 0 and 1000
         or coalesce((x ->> 'streak')::int, -1) not between 0 and max_day
         or coalesce((x ->> 'best')::int, -1) not between 0 and max_day
         or coalesce((x ->> 'last')::int, -2) not between -1 and max_day
         or coalesce((x ->> 'streak')::int, 0) > coalesce((x ->> 'best')::int, 0) then
        ok := false;
      end if;
    end loop;
    if jsonb_typeof(new.stats -> 'cats') is distinct from 'object' then ok := false; end if;
  exception when others then
    ok := false; -- a field that is missing or not a number
  end;
  if not ok then new.stats := null; end if;
  return new;
end;
$$;
drop trigger if exists user_data_sanitize on public.user_data;
create trigger user_data_sanitize before insert or update on public.user_data
  for each row execute function public.sanitize_stats();

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

-- 4b. The scoreboard: every listed player's nickname and stats (plus your own row, flagged `is_me`, even if you
--     hide). It never exposes ids or emails. The function runs with the owner's rights because the policies above
--     only let you read your own row.
create or replace function public.scoreboard()
returns table (nickname text, stats jsonb, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(u.nickname, 'Player ' || substr(md5(u.user_id::text), 1, 4)),
         u.stats,
         u.user_id = (select auth.uid())
  from public.user_data u
  where public.am_i_allowed()
    and u.stats is not null
    and (u.listed or u.user_id = (select auth.uid()))
  order by (u.stats ->> 'score')::numeric desc
  limit 500;
$$;
revoke all on function public.scoreboard() from public, anon;
grant execute on function public.scoreboard() to authenticated;

-- 5. Invite-only mode only: invite people (lower-case addresses of their Google / GitHub accounts):
-- insert into public.allowed_emails (email) values ('you@gmail.com'), ('friend@gmail.com');
