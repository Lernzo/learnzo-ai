-- Run this once in Supabase -> SQL Editor -> New query -> Run
create table if not exists public.kids_plays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  source text not null default 'games' check (source in ('games', 'paint')),
  created_at timestamptz default now()
);

create index if not exists kids_plays_email_idx
  on public.kids_plays (email);

create index if not exists kids_plays_created_idx
  on public.kids_plays (created_at desc);

alter table public.kids_plays enable row level security;