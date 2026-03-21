-- Run this in Supabase SQL Editor before using "Save Project to Supabase"

create extension if not exists pgcrypto;

create table if not exists public.digital_twin_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid null references auth.users(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_digital_twin_projects_owner_created
  on public.digital_twin_projects (owner_id, created_at desc);

create or replace function public.set_digital_twin_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_digital_twin_projects_updated_at on public.digital_twin_projects;
create trigger trg_digital_twin_projects_updated_at
before update on public.digital_twin_projects
for each row
execute function public.set_digital_twin_projects_updated_at();

