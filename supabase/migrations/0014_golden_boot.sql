-- Golden Boot winner override table.
-- When populated, the recompute function uses these player IDs instead of
-- the automatic "max goals" logic. This handles FIFA tiebreakers (assists,
-- minutes played) that we don't track.
--
-- Run on BOTH Supabase projects (family + work).

create table if not exists golden_boot_winners (
  player_id int primary key references players(id) on delete cascade,
  set_at    timestamptz not null default now()
);

alter table golden_boot_winners enable row level security;

create policy "read golden boot" on golden_boot_winners
  for select to authenticated using (true);

-- Admin-only write policies (same pattern as other admin tables)
create policy "admin insert golden boot" on golden_boot_winners
  for insert to authenticated
  with check (
    auth.email() in (
      'franken_robin@hotmail.com',
      'robin.franken@ctrlchain.com'
    )
  );

create policy "admin delete golden boot" on golden_boot_winners
  for delete to authenticated
  using (
    auth.email() in (
      'franken_robin@hotmail.com',
      'robin.franken@ctrlchain.com'
    )
  );
