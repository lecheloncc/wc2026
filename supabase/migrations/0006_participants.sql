-- Sub-account / participant identity layer.
-- A participant_key is either an email (owner) or `email#slug` (sub-account).
-- All predictions tables continue to use `user_email` as the column name; its
-- value is now interpreted as a participant_key. RLS write checks split off
-- the suffix so the parent's auth session can write rows for any of their
-- participants.

create table if not exists participant_profiles (
  participant_key text primary key,
  owner_email     text not null,
  display_name    text not null,
  is_owner        boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists participant_profiles_owner_idx
  on participant_profiles(owner_email);

alter table participant_profiles enable row level security;

drop policy if exists "read profiles" on participant_profiles;
create policy "read profiles" on participant_profiles
  for select to authenticated using (true);

drop policy if exists "insert own profiles" on participant_profiles;
create policy "insert own profiles" on participant_profiles
  for insert to authenticated
  with check (auth.email() = owner_email);

drop policy if exists "update own profiles" on participant_profiles;
create policy "update own profiles" on participant_profiles
  for update to authenticated
  using (auth.email() = owner_email)
  with check (auth.email() = owner_email);

drop policy if exists "delete sub-accounts" on participant_profiles;
create policy "delete sub-accounts" on participant_profiles
  for delete to authenticated
  using (auth.email() = owner_email and is_owner = false);

-- Backfill: every distinct user_email already in any predictions table gets
-- an owner profile. Display name defaults to the local-part of the email.
insert into participant_profiles (participant_key, owner_email, display_name, is_owner)
select distinct ue, ue, split_part(ue, '@', 1), true
from (
  select user_email as ue from match_predictions
  union select user_email from group_predictions
  union select user_email from topscorer_picks
  union select user_email from tournament_picks
  union select user_email from leaderboard_cache
) e
where ue is not null
on conflict (participant_key) do nothing;

-- Rewrite write RLS on predictions tables: parent (auth.email) of the
-- participant_key (split before '#') is allowed to write.
do $$
declare
  t text;
begin
  for t in select unnest(array[
      'match_predictions',
      'group_predictions',
      'topscorer_picks',
      'tournament_picks'
    ])
  loop
    execute format('drop policy if exists "upsert own match pred" on %I', t);
    execute format('drop policy if exists "update own match pred" on %I', t);
    execute format('drop policy if exists "delete own match pred" on %I', t);
    execute format('drop policy if exists "upsert own group pred" on %I', t);
    execute format('drop policy if exists "update own group pred" on %I', t);
    execute format('drop policy if exists "upsert own topscorer" on %I', t);
    execute format('drop policy if exists "update own topscorer" on %I', t);
    execute format('drop policy if exists "upsert own tournament" on %I', t);
    execute format('drop policy if exists "update own tournament" on %I', t);

    execute format($p$
      create policy "participant insert" on %I
        for insert to authenticated
        with check (auth.email() = split_part(user_email, '#', 1))
    $p$, t);
    execute format($p$
      create policy "participant update" on %I
        for update to authenticated
        using (auth.email() = split_part(user_email, '#', 1))
        with check (auth.email() = split_part(user_email, '#', 1))
    $p$, t);
    execute format($p$
      create policy "participant delete" on %I
        for delete to authenticated
        using (auth.email() = split_part(user_email, '#', 1))
    $p$, t);
  end loop;
end $$;
