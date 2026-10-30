-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

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

-- 5. Invite-only mode only: invite people (lower-case addresses of their Google / GitHub accounts):
-- insert into public.allowed_emails (email) values ('you@gmail.com'), ('friend@gmail.com');
