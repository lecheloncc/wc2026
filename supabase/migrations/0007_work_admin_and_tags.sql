-- WORK INSTANCE ONLY — do NOT run this on the family Supabase project.
--
-- Two things in this migration:
-- 1. Swap the hardcoded admin email from the family one (franken_robin@hotmail.com)
--    to the work one (robin.franken@ctrlchain.com) in every existing admin
--    write policy. The work instance's NEXT_PUBLIC_ADMIN_EMAIL changed but
--    the DB policies still referenced the old email, which silently rejected
--    admin writes.
-- 2. Add `department` and `country` columns to participant_profiles, plus a
--    new policy letting the admin update any profile (so you can assign tags).

-- ── Schema additions ────────────────────────────────────────────────────────
alter table participant_profiles
  add column if not exists department text,
  add column if not exists country    text;

-- ── Drop old policies referencing the family admin email ───────────────────
drop policy if exists "admin write board"             on leaderboard_cache;
drop policy if exists "admin update board"            on leaderboard_cache;
drop policy if exists "admin delete board"            on leaderboard_cache;
drop policy if exists "admin update matches"          on matches;
drop policy if exists "admin insert matches"          on matches;
drop policy if exists "admin insert group_results"    on group_results;
drop policy if exists "admin update group_results"    on group_results;
drop policy if exists "admin insert goals"            on player_goals;
drop policy if exists "admin delete goals"            on player_goals;
drop policy if exists "admin insert teams"            on teams;
drop policy if exists "admin update teams"            on teams;
drop policy if exists "admin insert players"          on players;
drop policy if exists "admin update players"          on players;
drop policy if exists "admin update profiles"         on participant_profiles;

-- ── Recreate with the work admin email ─────────────────────────────────────
-- leaderboard_cache
create policy "admin write board" on leaderboard_cache
  for insert to authenticated
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin update board" on leaderboard_cache
  for update to authenticated
  using      (auth.email() = 'robin.franken@ctrlchain.com')
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin delete board" on leaderboard_cache
  for delete to authenticated
  using (auth.email() = 'robin.franken@ctrlchain.com');

-- matches
create policy "admin update matches" on matches
  for update to authenticated
  using      (auth.email() = 'robin.franken@ctrlchain.com')
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin insert matches" on matches
  for insert to authenticated
  with check (auth.email() = 'robin.franken@ctrlchain.com');

-- group_results
create policy "admin insert group_results" on group_results
  for insert to authenticated
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin update group_results" on group_results
  for update to authenticated
  using      (auth.email() = 'robin.franken@ctrlchain.com')
  with check (auth.email() = 'robin.franken@ctrlchain.com');

-- player_goals
create policy "admin insert goals" on player_goals
  for insert to authenticated
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin delete goals" on player_goals
  for delete to authenticated
  using (auth.email() = 'robin.franken@ctrlchain.com');

-- teams
create policy "admin insert teams" on teams
  for insert to authenticated
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin update teams" on teams
  for update to authenticated
  using      (auth.email() = 'robin.franken@ctrlchain.com')
  with check (auth.email() = 'robin.franken@ctrlchain.com');

-- players
create policy "admin insert players" on players
  for insert to authenticated
  with check (auth.email() = 'robin.franken@ctrlchain.com');
create policy "admin update players" on players
  for update to authenticated
  using      (auth.email() = 'robin.franken@ctrlchain.com')
  with check (auth.email() = 'robin.franken@ctrlchain.com');

-- participant_profiles — admin can edit display_name / department / country
-- on any profile. Owners can still self-edit their own (existing policy).
create policy "admin update profiles" on participant_profiles
  for update to authenticated
  using      (auth.email() = 'robin.franken@ctrlchain.com')
  with check (auth.email() = 'robin.franken@ctrlchain.com');
