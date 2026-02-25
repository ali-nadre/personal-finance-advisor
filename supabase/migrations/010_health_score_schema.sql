-- Financial health score snapshots
-- Stores periodic score calculations per household
CREATE TABLE financial_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  savings_rate_score INTEGER NOT NULL CHECK (savings_rate_score >= 0 AND savings_rate_score <= 25),
  budget_adherence_score INTEGER NOT NULL CHECK (budget_adherence_score >= 0 AND budget_adherence_score <= 25),
  expense_diversity_score INTEGER NOT NULL CHECK (expense_diversity_score >= 0 AND expense_diversity_score <= 25),
  income_stability_score INTEGER NOT NULL CHECK (income_stability_score >= 0 AND income_stability_score <= 25),
  savings_rate DECIMAL(5, 2),        -- actual % for display
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_snapshots_household ON financial_health_snapshots(household_id, calculated_at DESC);

-- RLS disabled for MVP
ALTER TABLE financial_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_health_snapshots DISABLE ROW LEVEL SECURITY;
