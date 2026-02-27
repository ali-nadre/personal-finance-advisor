-- Financial Goals
-- Phase 3.2 of Personal Finance Advisor

create table if not exists financial_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  description text,
  goal_type text not null check (goal_type in (
    'savings', 'emergency_fund', 'debt_payoff', 'vacation', 'home_purchase', 'education', 'other'
  )),
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  deadline date,
  is_completed boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_goals_household_id_idx on financial_goals(household_id);

-- Contribution history (manual log of funds added to a goal)
create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references financial_goals(id) on delete cascade,
  amount numeric(12, 2) not null,
  note text,
  contributed_at date not null default current_date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists goal_contributions_goal_id_idx on goal_contributions(goal_id);

-- updated_at trigger (function already exists from prior migrations)
create trigger financial_goals_updated_at
  before update on financial_goals
  for each row execute function update_updated_at_column();

-- RLS off for MVP
alter table financial_goals disable row level security;
alter table goal_contributions disable row level security;
