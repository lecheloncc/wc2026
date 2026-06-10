-- Server-side prediction locks.
-- Prevents participants from editing predictions after the relevant deadline,
-- even if they bypass the UI and call the Supabase API directly.
--
-- Run on BOTH Supabase projects (family + work).

-- ============================================================
-- 1. Match predictions: lock after that match's kickoff
-- ============================================================

-- Drop the 0006 participant policies and replace with time-checked versions
drop policy if exists "participant insert" on match_predictions;
drop policy if exists "participant update" on match_predictions;
-- Keep delete as-is (no time gate needed — deleting a prediction is harmless)

create policy "participant insert locked" on match_predictions
  for insert to authenticated
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and (select kickoff from matches where id = match_id) > now()
  );

create policy "participant update locked" on match_predictions
  for update to authenticated
  using (
    auth.email() = split_part(user_email, '#', 1)
  )
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and (select kickoff from matches where id = match_id) > now()
  );

-- ============================================================
-- 2. Group predictions: lock after first match kickoff
-- ============================================================

drop policy if exists "participant insert" on group_predictions;
drop policy if exists "participant update" on group_predictions;

create policy "participant insert locked" on group_predictions
  for insert to authenticated
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and now() < (select min(kickoff) from matches)
  );

create policy "participant update locked" on group_predictions
  for update to authenticated
  using (
    auth.email() = split_part(user_email, '#', 1)
  )
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and now() < (select min(kickoff) from matches)
  );

-- ============================================================
-- 3. Topscorer picks: lock after first match kickoff
-- ============================================================

drop policy if exists "participant insert" on topscorer_picks;
drop policy if exists "participant update" on topscorer_picks;

create policy "participant insert locked" on topscorer_picks
  for insert to authenticated
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and now() < (select min(kickoff) from matches)
  );

create policy "participant update locked" on topscorer_picks
  for update to authenticated
  using (
    auth.email() = split_part(user_email, '#', 1)
  )
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and now() < (select min(kickoff) from matches)
  );

-- ============================================================
-- 4. Tournament picks: lock after first match kickoff
-- ============================================================

drop policy if exists "participant insert" on tournament_picks;
drop policy if exists "participant update" on tournament_picks;

create policy "participant insert locked" on tournament_picks
  for insert to authenticated
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and now() < (select min(kickoff) from matches)
  );

create policy "participant update locked" on tournament_picks
  for update to authenticated
  using (
    auth.email() = split_part(user_email, '#', 1)
  )
  with check (
    auth.email() = split_part(user_email, '#', 1)
    and now() < (select min(kickoff) from matches)
  );
