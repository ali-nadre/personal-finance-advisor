-- First, let's see what policies exist (run this to check)
-- SELECT * FROM pg_policies WHERE tablename IN ('households', 'household_members');

-- Drop all existing policies on households to start fresh
DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Users can update households with write permission" ON households;
DROP POLICY IF EXISTS "Creators can delete their households" ON households;

-- Recreate households policies (simplified and verified)

-- SELECT: Users can view households they are members of
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Anyone authenticated can create a household
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Creator or members with write permission can update
CREATE POLICY "Users can update households with write permission"
  ON households FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR user_can_manage_household(id, auth.uid())
  );

-- DELETE: Only creator can delete
CREATE POLICY "Creators can delete their households"
  ON households FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
