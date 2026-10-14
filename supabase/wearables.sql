-- Apps & Devices connection status.
-- The page saves the same status on this phone (curlyGirlFitness.you.v1,
-- under the signed-in email, key wearables). When this column exists, the
-- page also writes that status onto the signed-in profile.
-- Status values: interest, manual, pending, connected.
-- Manual entries are numbers the member typed. They are not readings from
-- Apple Health, Health Connect, or a watch.
-- Access tokens are not stored in this column.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists wearables jsonb not null default '{}'::jsonb;

-- Token exchange results. The wearable-oauth edge function writes this with
-- the service role. Members cannot read or write it from the app.
create table if not exists public.wearable_tokens (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  access_token text not null default '',
  refresh_token text not null default '',
  expires_at timestamptz,
  scope text not null default '',
  updated_at timestamptz not null default now(),
  primary key (owner_id, provider)
);

alter table public.wearable_tokens enable row level security;
revoke all on public.wearable_tokens from anon, authenticated;
