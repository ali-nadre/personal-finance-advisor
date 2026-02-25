-- Create categories table for organizing budget items
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT, -- Optional emoji or icon identifier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, name, type) -- Prevent duplicate category names per household/type
);

-- Create budget_items table for tracking individual budget entries
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_categories_household ON categories(household_id);
CREATE INDEX idx_budget_items_household ON budget_items(household_id);
CREATE INDEX idx_budget_items_category ON budget_items(category_id);
CREATE INDEX idx_budget_items_year ON budget_items(year);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories for new households
-- Note: These will be created via application logic when a household is created

-- RLS Policies (disabled for MVP, but including structure for future)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for MVP (consistent with households approach)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items DISABLE ROW LEVEL SECURITY;
