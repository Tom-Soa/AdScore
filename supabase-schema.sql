-- AdScore AI — Supabase schema
-- Run this in your Supabase SQL editor

create table if not exists analyses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  script_preview text not null,
  platform text not null check (platform in ('google', 'meta', 'both')),
  score integer not null check (score >= 0 and score <= 100),
  niveau text not null check (niveau in ('FAIBLE', 'MODÉRÉ', 'ÉLEVÉ', 'CRITIQUE')),
  resume text not null,
  result_json text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  feedback_reason text,
  user_id uuid references auth.users(id) on delete set null
);

-- Index for common queries
create index if not exists analyses_created_at_idx on analyses (created_at desc);
create index if not exists analyses_platform_idx on analyses (platform);
create index if not exists analyses_status_idx on analyses (status);
create index if not exists analyses_score_idx on analyses (score);

-- Row Level Security (enable after adding auth)
-- alter table analyses enable row level security;
-- create policy "Users can read own analyses" on analyses for select using (auth.uid() = user_id);
-- create policy "Users can insert own analyses" on analyses for insert with check (auth.uid() = user_id);
-- create policy "Users can update own analyses" on analyses for update using (auth.uid() = user_id);
