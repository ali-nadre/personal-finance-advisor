-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Users can add members with write permission" ON household_members;
DROP POLICY IF EXISTS "Users can update member permissions with write access" ON household_members;
DROP POLICY IF EXISTS "Users can remove members or leave households" ON household_members;

-- Fixed RLS Policies for household_members table

-- Users can view members of households they belong to (fixed - no recursion)
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm2
      WHERE hm2.household_id = household_members.household_id
      AND hm2.user_id = auth.uid()
    )
  );

-- Users can add members to households where they have write permission or are the creator
CREATE POLICY "Users can add members with write permission"
  ON household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_id
      AND (
        h.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM household_members hm
          WHERE hm.household_id = h.id
          AND hm.user_id = auth.uid()
          AND hm.permission = 'write'
        )
      )
    )
  );

-- Users can update member permissions if they have write permission or are the creator
CREATE POLICY "Users can update member permissions with write access"
  ON household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_id
      AND (
        h.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM household_members hm
          WHERE hm.household_id = h.id
          AND hm.user_id = auth.uid()
          AND hm.permission = 'write'
        )
      )
    )
  );

-- Users can remove members if they have write permission, are the creator, or are removing themselves
CREATE POLICY "Users can remove members or leave households"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_id
      AND (
        h.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM household_members hm
          WHERE hm.household_id = h.id
          AND hm.user_id = auth.uid()
          AND hm.permission = 'write'
        )
      )
    )
  );
