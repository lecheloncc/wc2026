-- Tournament-level pre-tournament bonus picks: champion, finalists pair, dark horse.
-- Locks at the opening match kickoff (same UX rule as topscorer + group order).

create table if not exists tournament_picks (
  user_email          text primary key,
  champion_team_id    int references teams(id),
  finalist_a_team_id  int references teams(id),
  finalist_b_team_id  int references teams(id),
  dark_horse_team_id  int references teams(id),
  updated_at          timestamptz not null default now(),
  check (finalist_a_team_id is null or finalist_b_team_id is null
         or finalist_a_team_id <> finalist_b_team_id)
);

alter table tournament_picks enable row level security;

create policy "read tournament" on tournament_picks
  for select to authenticated using (true);
create policy "upsert own tournament" on tournament_picks
  for insert to authenticated with check (auth.email() = user_email);
create policy "update own tournament" on tournament_picks
  for update to authenticated
  using (auth.email() = user_email)
  with check (auth.email() = user_email);

-- New points column on leaderboard cache
alter table leaderboard_cache
  add column if not exists tournament_points int not null default 0;

-- Pot tracking on teams (1 = top seed, 4 = bottom seed). Backfilled from
-- insertion order within each group (the seed insert adds teams pot-1 first).
alter table teams add column if not exists pot int;
with ranked as (
  select id,
         row_number() over (partition by group_code order by id) as rn
  from teams
)
update teams t
set pot = ranked.rn
from ranked
where t.id = ranked.id and (t.pot is null or t.pot <> ranked.rn);
