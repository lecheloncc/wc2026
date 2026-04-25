-- Admin write policies. The admin email must match NEXT_PUBLIC_ADMIN_EMAIL in the app.
-- Change the literal below if you ever rotate the admin email.

-- leaderboard_cache: admin can upsert/update all rows
create policy "admin write board" on leaderboard_cache
  for insert to authenticated
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin update board" on leaderboard_cache
  for update to authenticated
  using (auth.email() = 'franken_robin@hotmail.com')
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin delete board" on leaderboard_cache
  for delete to authenticated
  using (auth.email() = 'franken_robin@hotmail.com');

-- matches: admin can update scores/status (schema already allows SELECT for all authenticated)
create policy "admin update matches" on matches
  for update to authenticated
  using (auth.email() = 'franken_robin@hotmail.com')
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin insert matches" on matches
  for insert to authenticated
  with check (auth.email() = 'franken_robin@hotmail.com');

-- group_results: admin enters the final group order
create policy "admin insert group_results" on group_results
  for insert to authenticated
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin update group_results" on group_results
  for update to authenticated
  using (auth.email() = 'franken_robin@hotmail.com')
  with check (auth.email() = 'franken_robin@hotmail.com');

-- player_goals: admin logs goals
create policy "admin insert goals" on player_goals
  for insert to authenticated
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin delete goals" on player_goals
  for delete to authenticated
  using (auth.email() = 'franken_robin@hotmail.com');

-- players + teams: admin can add/edit (e.g. when squads are released)
create policy "admin insert teams" on teams
  for insert to authenticated
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin update teams" on teams
  for update to authenticated
  using (auth.email() = 'franken_robin@hotmail.com')
  with check (auth.email() = 'franken_robin@hotmail.com');

create policy "admin insert players" on players
  for insert to authenticated
  with check (auth.email() = 'franken_robin@hotmail.com');
create policy "admin update players" on players
  for update to authenticated
  using (auth.email() = 'franken_robin@hotmail.com')
  with check (auth.email() = 'franken_robin@hotmail.com');
