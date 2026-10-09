-- Client group on the trainer-client link. Safe to run more than once.
alter table public.pairs add column if not exists client_status text;

do $$ begin
  alter table public.pairs
    add constraint pairs_client_status_check
    check (client_status is null or client_status in ('prospects', 'basic', 'deactivated', 'coaching'));
exception when duplicate_object then null;
end $$;
