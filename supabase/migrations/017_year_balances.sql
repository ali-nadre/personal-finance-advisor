-- Year balances: track beginning balance per household per year
-- Used for end-of-year projection on the Cash Flow page

CREATE TABLE IF NOT EXISTS household_year_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  beginning_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, year)
);

ALTER TABLE household_year_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household members can manage year balances"
  ON household_year_balances FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_year_balances_household ON household_year_balances(household_id);
