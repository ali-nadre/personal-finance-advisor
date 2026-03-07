-- ============================================================
-- Migration 015: Household Invites (invite by email)
-- ============================================================
-- Allows inviting users who haven't signed up yet.
-- When the invited user logs in, process_pending_invites()
-- is called and auto-adds them to the household.
--
-- HOW TO APPLY:
--   Paste into the Supabase SQL Editor and click Run.
-- ============================================================

CREATE TABLE IF NOT EXISTS household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'write' CHECK (permission IN ('read', 'write')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, invited_email)
);

CREATE INDEX IF NOT EXISTS idx_household_invites_email ON household_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_household_invites_household ON household_invites(household_id);

ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Household members/owners can see pending invites for their household
CREATE POLICY "household_invites_select" ON household_invites FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

-- Only household managers/owners can send invites
CREATE POLICY "household_invites_insert" ON household_invites FOR INSERT
  WITH CHECK (
    user_can_manage_household(household_id, auth.uid())
    AND invited_by = auth.uid()
  );

-- Only household managers/owners can cancel invites
CREATE POLICY "household_invites_delete" ON household_invites FOR DELETE
  USING (user_can_manage_household(household_id, auth.uid()));


-- ─── process_pending_invites() ───────────────────────────────────────────────
-- Call this after a user signs up or logs in.
-- Finds any pending invites for their email, adds them to household_members,
-- then deletes the processed invites.
-- SECURITY DEFINER: runs as the function owner, bypassing RLS so it can
-- insert into household_members without the new user being a member yet.

CREATE OR REPLACE FUNCTION process_pending_invites(user_email TEXT, user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  inv RECORD;
  processed INTEGER := 0;
BEGIN
  FOR inv IN
    SELECT * FROM household_invites
    WHERE lower(invited_email) = lower(user_email)
  LOOP
    -- Add to household_members (skip if already a member)
    INSERT INTO household_members (household_id, user_id, permission, invited_by)
    VALUES (inv.household_id, user_uuid, inv.permission, inv.invited_by)
    ON CONFLICT (household_id, user_id) DO NOTHING;

    -- Remove processed invite
    DELETE FROM household_invites WHERE id = inv.id;

    processed := processed + 1;
  END LOOP;

  RETURN processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
