-- Run this in Supabase SQL Editor to enable accounts and cloud-saved application data.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  resume jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  company text not null,
  location text not null default '',
  url text not null default '',
  salary text not null default '',
  deadline date,
  status text not null default 'Saved'
    check (status in ('Saved','Applied','Interview','Offer','Rejected')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

create policy "Users manage their own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage their own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists jobs_user_created_idx on public.jobs(user_id, created_at desc);
