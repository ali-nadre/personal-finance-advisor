-- Scenarios (What-If Engine)
-- Phase 3.1 of Personal Finance Advisor

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references auth.users(id),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_household_id_idx on scenarios(household_id);

-- Scenario items: free-form income/expense rows (normalized to monthly amounts)
create table if not exists scenario_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  label text not null,
  category_type text not null check (category_type in ('income', 'expense')),
  monthly_amount numeric(12, 2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenario_items_scenario_id_idx on scenario_items(scenario_id);

-- updated_at triggers (function may already exist from prior migrations)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scenarios_updated_at
  before update on scenarios
  for each row execute function update_updated_at_column();

create trigger scenario_items_updated_at
  before update on scenario_items
  for each row execute function update_updated_at_column();

-- RLS off for MVP
alter table scenarios disable row level security;
alter table scenario_items disable row level security;
