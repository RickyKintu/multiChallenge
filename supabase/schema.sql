-- MultiChallenge Supabase Schema
-- Run this in the Supabase SQL editor

-- ─── Players ─────────────────────────────────────────────────────────────────
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  avatar text not null default 'dragon',
  games_played int not null default 0,
  games_won int not null default 0,
  total_points int not null default 0,
  best_streak int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Rooms ───────────────────────────────────────────────────────────────────
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid references players(id),
  status text not null default 'lobby',
  -- status: lobby | playing | finished
  current_round int not null default 0,
  card_picker_index int not null default 0,
  current_minigame text,
  minigame_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Room Players ────────────────────────────────────────────────────────────
create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  player_id uuid references players(id),
  username text not null,
  avatar text not null default 'dragon',
  score int not null default 0,
  streak int not null default 0,
  is_ready boolean not null default false,
  is_connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_id, player_id)
);

-- ─── Round Results ───────────────────────────────────────────────────────────
create table if not exists round_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round_number int not null,
  minigame text not null,
  results jsonb not null, -- [{player_id, placement, points_earned, bonus_points, new_score, new_streak}]
  created_at timestamptz not null default now()
);

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable Realtime for these tables in the Supabase dashboard:
-- rooms, room_players, round_results

-- ─── RLS Policies (open for now — tighten per your auth strategy) ─────────────
alter table players enable row level security;
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table round_results enable row level security;

create policy "public read" on players for select using (true);
create policy "public insert" on players for insert with check (true);
create policy "public update" on players for update using (true);

create policy "public read" on rooms for select using (true);
create policy "public insert" on rooms for insert with check (true);
create policy "public update" on rooms for update using (true);

create policy "public read" on room_players for select using (true);
create policy "public insert" on room_players for insert with check (true);
create policy "public update" on room_players for update using (true);
create policy "public delete" on room_players for delete using (true);

create policy "public read" on round_results for select using (true);
create policy "public insert" on round_results for insert with check (true);
