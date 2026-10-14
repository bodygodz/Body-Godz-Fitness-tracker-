-- Extra fields from Settings → Edit profile.
-- The app already saves these on this phone (curlyGirlFitness.memberProfile.v1,
-- plus height and goal weight in the existing tracker settings). When these
-- columns exist, it also writes them to the signed-in profile row.
-- Safe to run more than once.

alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists gender text not null default '';
alter table public.profiles add column if not exists height_in numeric;
alter table public.profiles add column if not exists goal_weight numeric;
alter table public.profiles add column if not exists goals text not null default '';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists units text not null default 'lb';
