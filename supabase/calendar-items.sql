-- Day plans from the Calendar screen.
-- The app already saves these per account in local storage
-- (curlyGirlFitness.calendar.v1) and uses this table when it exists.
-- Safe to run more than once.

create table if not exists public.calendar_items (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  title text not null,
  start_time text not null,
  end_time text not null default '',
  notes text not null default '',
  client_id text not null default '',
  client_name text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.calendar_items enable row level security;
revoke all on public.calendar_items from anon;
grant select, insert, update, delete on public.calendar_items to authenticated;

drop policy if exists "cgf calendar owner" on public.calendar_items;
create policy "cgf calendar owner" on public.calendar_items
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
