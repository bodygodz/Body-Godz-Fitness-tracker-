-- Profile photo for the header bubble.
-- The app already saves a compressed data URL per account in local storage
-- (curlyGirlFitness.avatar.v1). When this column exists, it also writes that
-- same photo to profiles.avatar_url.
-- Safe to run more than once.

alter table public.profiles add column if not exists avatar_url text not null default '';
