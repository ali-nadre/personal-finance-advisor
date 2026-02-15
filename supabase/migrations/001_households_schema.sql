-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create household_members junction table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);

-- Enable Row Level Security
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for households table

-- Users can view households they are members of
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create households (they become the creator)
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update households if they have write permission or are the creator
CREATE POLICY "Users can update households with write permission"
  ON households FOR UPDATE
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid() AND permission = 'write'
    )
  );

-- Users can delete households if they are the creator
CREATE POLICY "Creators can delete their households"
  ON households FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for household_members table

-- Users can view members of households they belong to
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can add members to households where they have write permission or are the creator
CREATE POLICY "Users can add members with write permission"
  ON household_members FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT h.id
      FROM households h
      LEFT JOIN household_members hm ON h.id = hm.household_id
      WHERE h.created_by = auth.uid() OR (hm.user_id = auth.uid() AND hm.permission = 'write')
    )
  );

-- Users can update member permissions if they have write permission or are the creator
CREATE POLICY "Users can update member permissions with write access"
  ON household_members FOR UPDATE
  USING (
    household_id IN (
      SELECT h.id
      FROM households h
      LEFT JOIN household_members hm ON h.id = hm.household_id
      WHERE h.created_by = auth.uid() OR (hm.user_id = auth.uid() AND hm.permission = 'write')
    )
  );

-- Users can remove members if they have write permission or are the creator
-- Users can also remove themselves from any household
CREATE POLICY "Users can remove members or leave households"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    household_id IN (
      SELECT h.id
      FROM households h
      LEFT JOIN household_members hm ON h.id = hm.household_id
      WHERE h.created_by = auth.uid() OR (hm.user_id = auth.uid() AND hm.permission = 'write')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on households
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add creator as a member with write permission
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO household_members (household_id, user_id, permission, invited_by)
  VALUES (NEW.id, NEW.created_by, 'write', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add creator as member when household is created
CREATE TRIGGER add_creator_to_household
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();
