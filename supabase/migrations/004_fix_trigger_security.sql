-- Drop and recreate the trigger function with SECURITY DEFINER
-- This allows it to bypass RLS when auto-adding the creator as a member

DROP TRIGGER IF EXISTS add_creator_to_household ON households;
DROP FUNCTION IF EXISTS add_creator_as_member();

-- Recreate function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO household_members (household_id, user_id, permission, invited_by)
  VALUES (NEW.id, NEW.created_by, 'write', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER add_creator_to_household
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();
