-- =========================================================
-- LEARNZO AI - PostgreSQL / Supabase schema
-- Run this ONCE in Supabase -> SQL Editor -> New query -> Run
-- Safe to re-run; uses IF NOT EXISTS guards.
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- Profiles (mirrors auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'STUDENT' check (role in ('STUDENT','PARENT','ADMIN')),
  display_name text,
  grade int,
  board text,
  locale text default 'en',
  created_at timestamptz default now()
);

-- ---------- Subscriptions ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('FREE','PLUS_MONTHLY','PLUS_YEARLY','FAMILY_YEARLY')),
  status text not null default 'active' check (status in ('active','expired','cancelled','pending')),
  provider text,
  provider_subscription_id text,
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists subscriptions_user_status_idx on public.subscriptions (user_id, status);

-- ---------- Payments ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  amount_inr numeric(10,2) not null,
  currency text default 'INR',
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  raw jsonb,
  created_at timestamptz default now()
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create unique index if not exists payments_provider_payment_id_uidx
  on public.payments (provider, provider_payment_id) where provider_payment_id is not null;

-- ---------- Questions ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('text','image','pdf')),
  raw_input text,
  subject text,
  topic text,
  difficulty text,
  created_at timestamptz default now()
);
create index if not exists questions_user_idx on public.questions (user_id, created_at desc);
create index if not exists questions_subject_idx on public.questions (subject);

-- ---------- AI responses ----------
create table if not exists public.ai_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  provider text not null,
  model text not null,
  payload jsonb not null,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  created_at timestamptz default now()
);
create index if not exists ai_responses_question_idx on public.ai_responses (question_id);

-- ---------- Saved questions ----------
create table if not exists public.saved_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  note text,
  created_at timestamptz default now(),
  unique (user_id, question_id)
);

-- ---------- Practice sets ----------
create table if not exists public.practice_sets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.practice_sets(id) on delete cascade,
  level text not null check (level in ('easy','medium','challenge')),
  question text not null,
  hint text,
  answer text,
  explanation text
);
create index if not exists practice_questions_set_idx on public.practice_questions (set_id);

-- ---------- Attempts ----------
create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  question_id uuid references public.questions(id) on delete cascade,
  answer text,
  correct boolean,
  created_at timestamptz default now()
);

-- ---------- PDF exports ----------
create table if not exists public.pdf_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  question_id uuid references public.questions(id) on delete set null,
  storage_path text,
  created_at timestamptz default now()
);

-- ---------- Usage limits ----------
create table if not exists public.usage_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  period_start date not null default date_trunc('month', now())::date,
  solves_used int not null default 0,
  practices_used int not null default 0,
  pdfs_used int not null default 0,
  tokens_used int not null default 0
);

-- ---------- Feedback ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  question_id uuid references public.questions(id) on delete cascade,
  helpful boolean not null,
  reason text,
  comment text,
  created_at timestamptz default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- ---------- Admin settings ----------
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.payments           enable row level security;
alter table public.questions          enable row level security;
alter table public.ai_responses       enable row level security;
alter table public.saved_questions    enable row level security;
alter table public.practice_sets      enable row level security;
alter table public.practice_questions enable row level security;
alter table public.question_attempts  enable row level security;
alter table public.pdf_exports        enable row level security;
alter table public.usage_limits       enable row level security;
alter table public.feedback           enable row level security;

-- Drop existing policies so re-running is safe
drop policy if exists "own profile"   on public.profiles;
drop policy if exists "own subs"      on public.subscriptions;
drop policy if exists "own pays"      on public.payments;
drop policy if exists "own questions" on public.questions;
drop policy if exists "own saved"     on public.saved_questions;
drop policy if exists "own sets"      on public.practice_sets;
drop policy if exists "own usage"     on public.usage_limits;
drop policy if exists "own attempts"  on public.question_attempts;
drop policy if exists "own pdfs"      on public.pdf_exports;
drop policy if exists "own feedback"  on public.feedback;

create policy "own profile"   on public.profiles           for all    using (auth.uid() = id);
create policy "own subs"      on public.subscriptions      for select using (auth.uid() = user_id);
create policy "own pays"      on public.payments           for select using (auth.uid() = user_id);
create policy "own questions" on public.questions          for all    using (auth.uid() = user_id);
create policy "own saved"     on public.saved_questions    for all    using (auth.uid() = user_id);
create policy "own sets"      on public.practice_sets      for all    using (auth.uid() = user_id);
create policy "own usage"     on public.usage_limits       for all    using (auth.uid() = user_id);
create policy "own attempts"  on public.question_attempts  for all    using (auth.uid() = user_id);
create policy "own pdfs"      on public.pdf_exports        for all    using (auth.uid() = user_id);
create policy "own feedback"  on public.feedback           for insert with check (auth.uid() = user_id);

-- =========================================================
-- Auto-create profile + usage_limits on signup
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
    values (new.id, 'STUDENT')
    on conflict do nothing;

  insert into public.usage_limits (user_id)
    values (new.id)
    on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();