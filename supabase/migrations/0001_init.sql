-- World Cup 2026 Prediction Game — initial schema
-- Run in Supabase SQL editor.

create table if not exists teams (
  id serial primary key,
  name text not null unique,
  group_code text not null check (group_code ~ '^[A-L]$'),
  flag_emoji text,
  fifa_code text
);
create index if not exists teams_group_idx on teams(group_code);

create table if not exists players (
  id serial primary key,
  name text not null,
  team_id int not null references teams(id) on delete cascade,
  position text
);
create index if not exists players_team_idx on players(team_id);

create table if not exists matches (
  id serial primary key,
  stage text not null check (stage in ('group','R32','R16','QF','SF','3rd','final')),
  group_code text,                        -- only set for group-stage
  knockout_slot text,                     -- e.g. 'R32-1', 'QF-3'
  home_team_id int references teams(id),
  away_team_id int references teams(id),
  kickoff timestamptz not null,
  home_score int,
  away_score int,
  status text not null default 'scheduled'
    check (status in ('scheduled','live','final','postponed'))
);
create index if not exists matches_kickoff_idx on matches(kickoff);
create index if not exists matches_stage_idx on matches(stage);

-- Predictions
create table if not exists match_predictions (
  user_email text not null,
  match_id int not null references matches(id) on delete cascade,
  pred_home int not null check (pred_home >= 0),
  pred_away int not null check (pred_away >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_email, match_id)
);

create table if not exists group_predictions (
  user_email text not null,
  group_code text not null check (group_code ~ '^[A-L]$'),
  order_team_ids int[] not null,          -- length 4
  updated_at timestamptz not null default now(),
  primary key (user_email, group_code),
  check (array_length(order_team_ids, 1) = 4)
);

create table if not exists topscorer_picks (
  user_email text primary key,
  player_ids int[] not null,              -- length 3
  updated_at timestamptz not null default now(),
  check (array_length(player_ids, 1) = 3)
);

-- Actuals (admin-entered)
create table if not exists player_goals (
  id serial primary key,
  player_id int not null references players(id) on delete cascade,
  match_id int not null references matches(id) on delete cascade,
  minute int,
  inserted_at timestamptz not null default now()
);
create index if not exists player_goals_player_idx on player_goals(player_id);

create table if not exists group_results (
  group_code text primary key check (group_code ~ '^[A-L]$'),
  order_team_ids int[] not null,
  finalized_at timestamptz not null default now(),
  check (array_length(order_team_ids, 1) = 4)
);

create table if not exists leaderboard_cache (
  user_email text primary key,
  match_points int not null default 0,
  group_points int not null default 0,
  topscorer_points int not null default 0,
  total int not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists leaderboard_total_idx on leaderboard_cache(total desc);

-- Row-level security
alter table teams enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_predictions enable row level security;
alter table group_predictions enable row level security;
alter table topscorer_picks enable row level security;
alter table player_goals enable row level security;
alter table group_results enable row level security;
alter table leaderboard_cache enable row level security;

-- Everyone authenticated can read reference data and leaderboard
create policy "read teams"      on teams      for select to authenticated using (true);
create policy "read players"    on players    for select to authenticated using (true);
create policy "read matches"    on matches    for select to authenticated using (true);
create policy "read goals"      on player_goals for select to authenticated using (true);
create policy "read group res"  on group_results for select to authenticated using (true);
create policy "read board"      on leaderboard_cache for select to authenticated using (true);

-- Users can read their own predictions AND everyone else's (so leaderboard pages can show picks after lock).
-- For v1, read-all is fine; tighten later if needed.
create policy "read match preds" on match_predictions for select to authenticated using (true);
create policy "read group preds" on group_predictions for select to authenticated using (true);
create policy "read topscorers"  on topscorer_picks   for select to authenticated using (true);

-- Users can only write their own predictions
create policy "upsert own match pred" on match_predictions
  for insert to authenticated with check (auth.email() = user_email);
create policy "update own match pred" on match_predictions
  for update to authenticated using (auth.email() = user_email) with check (auth.email() = user_email);
create policy "delete own match pred" on match_predictions
  for delete to authenticated using (auth.email() = user_email);

create policy "upsert own group pred" on group_predictions
  for insert to authenticated with check (auth.email() = user_email);
create policy "update own group pred" on group_predictions
  for update to authenticated using (auth.email() = user_email) with check (auth.email() = user_email);

create policy "upsert own topscorer" on topscorer_picks
  for insert to authenticated with check (auth.email() = user_email);
create policy "update own topscorer" on topscorer_picks
  for update to authenticated using (auth.email() = user_email) with check (auth.email() = user_email);
