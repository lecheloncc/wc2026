-- Run on BOTH Supabase projects (family + work).
--
-- Tracks who has paid the entry fee. Separate table from participant_profiles
-- so we can keep the existing "user can edit own profile" policy without
-- letting users mark themselves as paid.

create table if not exists participant_payments (
  participant_key text primary key
    references participant_profiles(participant_key) on delete cascade,
  paid       boolean      not null default false,
  paid_at    timestamptz,
  notes      text,
  updated_at timestamptz  not null default now()
);

alter table participant_payments enable row level security;

drop policy if exists "read payments"          on participant_payments;
drop policy if exists "admin upsert payments"  on participant_payments;
drop policy if exists "admin update payments"  on participant_payments;
drop policy if exists "admin delete payments"  on participant_payments;

create policy "read payments" on participant_payments
  for select to authenticated using (true);

-- Both admin emails are listed so the same migration works on both
-- deployments. The wrong-email account simply has no auth session here.
create policy "admin upsert payments" on participant_payments
  for insert to authenticated
  with check (
    auth.email() in (
      'franken_robin@hotmail.com',
      'robin.franken@ctrlchain.com'
    )
  );
create policy "admin update payments" on participant_payments
  for update to authenticated
  using (
    auth.email() in (
      'franken_robin@hotmail.com',
      'robin.franken@ctrlchain.com'
    )
  )
  with check (
    auth.email() in (
      'franken_robin@hotmail.com',
      'robin.franken@ctrlchain.com'
    )
  );
create policy "admin delete payments" on participant_payments
  for delete to authenticated
  using (
    auth.email() in (
      'franken_robin@hotmail.com',
      'robin.franken@ctrlchain.com'
    )
  );
