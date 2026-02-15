-- Drop all household_members policies
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Users can add members with write permission" ON household_members;
DROP POLICY IF EXISTS "Users can update member permissions with write access" ON household_members;
DROP POLICY IF EXISTS "Users can remove members or leave households" ON household_members;

-- Create a helper function to check if a user belongs to a household
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION user_is_household_member(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = household_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if user can manage a household
CREATE OR REPLACE FUNCTION user_can_manage_household(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM households h
    LEFT JOIN household_members hm ON h.id = hm.household_id
    WHERE h.id = household_uuid
    AND (
      h.created_by = user_uuid
      OR (hm.user_id = user_uuid AND hm.permission = 'write')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the helper functions (no recursion!)

-- Users can view members of households they belong to
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

-- Users can add members if they can manage the household
CREATE POLICY "Users can add members with write permission"
  ON household_members FOR INSERT
  WITH CHECK (user_can_manage_household(household_id, auth.uid()));

-- Users can update permissions if they can manage the household
CREATE POLICY "Users can update member permissions with write access"
  ON household_members FOR UPDATE
  USING (user_can_manage_household(household_id, auth.uid()));

-- Users can remove members if they can manage the household OR are removing themselves
CREATE POLICY "Users can remove members or leave households"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR user_can_manage_household(household_id, auth.uid())
  );
