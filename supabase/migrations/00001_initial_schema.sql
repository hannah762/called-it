-- Called It! — Initial database schema
-- Run this in your Supabase SQL editor or via the Supabase CLI

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  display_name text not null,
  avatar_url text,
  coin_balance integer not null default 500,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  created_at timestamptz not null default now()
);

-- Bets
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id),
  question text not null,
  status text not null default 'open' check (status in ('open', 'locked', 'resolved', 'expired')),
  deadline timestamptz not null,
  winning_option_id uuid,
  join_code text unique not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Options
create table public.options (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  label text not null,
  is_wild_card boolean not null default false,
  sort_order integer not null default 0
);

-- Add foreign key for winning_option_id after options table exists
alter table public.bets
  add constraint bets_winning_option_id_fkey
  foreign key (winning_option_id) references public.options(id);

-- Wagers (one per user per bet)
create table public.wagers (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id),
  user_id uuid not null references public.users(id),
  option_id uuid not null references public.options(id),
  amount integer not null check (amount >= 10 and amount <= 200),
  created_at timestamptz not null default now(),
  unique (bet_id, user_id)
);

-- Payouts (written on resolution)
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id),
  user_id uuid not null references public.users(id),
  amount integer not null,
  created_at timestamptz not null default now()
);

-- Bet participants (tracks who joined, even before wagering)
create table public.bet_participants (
  bet_id uuid not null references public.bets(id),
  user_id uuid not null references public.users(id),
  joined_at timestamptz not null default now(),
  primary key (bet_id, user_id)
);

-- Indexes for common queries
create index idx_bets_creator on public.bets(creator_id);
create index idx_bets_status on public.bets(status);
create index idx_bets_join_code on public.bets(join_code);
create index idx_wagers_bet on public.wagers(bet_id);
create index idx_wagers_user on public.wagers(user_id);
create index idx_options_bet on public.options(bet_id);
create index idx_participants_user on public.bet_participants(user_id);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.bets enable row level security;
alter table public.options enable row level security;
alter table public.wagers enable row level security;
alter table public.payouts enable row level security;
alter table public.bet_participants enable row level security;

-- RLS Policies: Users
create policy "Users can read all profiles"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- RLS Policies: Bets (readable by anyone, writable by creator)
create policy "Anyone can read bets"
  on public.bets for select
  using (true);

create policy "Authenticated users can create bets"
  on public.bets for insert
  with check (auth.uid() = creator_id);

create policy "Creator can update own bets"
  on public.bets for update
  using (auth.uid() = creator_id);

-- RLS Policies: Options
create policy "Anyone can read options"
  on public.options for select
  using (true);

create policy "Bet creator can manage options"
  on public.options for insert
  with check (
    exists (
      select 1 from public.bets
      where bets.id = options.bet_id
      and bets.creator_id = auth.uid()
    )
  );

-- RLS Policies: Wagers
create policy "Bet participants can read wagers"
  on public.wagers for select
  using (true);

create policy "Authenticated users can place wagers"
  on public.wagers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wagers"
  on public.wagers for update
  using (auth.uid() = user_id);

create policy "Users can delete own wagers"
  on public.wagers for delete
  using (auth.uid() = user_id);

-- RLS Policies: Payouts
create policy "Anyone can read payouts"
  on public.payouts for select
  using (true);

-- RLS Policies: Participants
create policy "Anyone can read participants"
  on public.bet_participants for select
  using (true);

create policy "Users can join bets"
  on public.bet_participants for insert
  with check (auth.uid() = user_id);

-- Enable Realtime for key tables
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.wagers;
alter publication supabase_realtime add table public.payouts;
