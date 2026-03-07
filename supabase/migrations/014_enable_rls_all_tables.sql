-- ============================================================
-- Migration 014: Re-enable RLS on all tables
-- ============================================================
-- Relies on helper functions from migration 003:
--   user_is_household_member(household_uuid, user_uuid) SECURITY DEFINER
--   user_can_manage_household(household_uuid, user_uuid) SECURITY DEFINER
--
-- HOW TO APPLY:
--   Paste this entire file into the Supabase SQL Editor and click Run.
--
-- WHAT THIS DOES:
--   Re-enables Row Level Security on all 13 tables.
--   Each table only allows access to users who are members
--   of the relevant household.
-- ============================================================


-- ─── Re-enable RLS on households + household_members ─────────────────────────
-- (These were disabled in 006. Their policies were last set in 005.)

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;


-- ─── categories ──────────────────────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "categories_insert" ON categories FOR INSERT
  WITH CHECK (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "categories_update" ON categories FOR UPDATE
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "categories_delete" ON categories FOR DELETE
  USING (user_is_household_member(household_id, auth.uid()));


-- ─── budget_items ─────────────────────────────────────────────────────────────

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_items_select" ON budget_items;
DROP POLICY IF EXISTS "budget_items_insert" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete" ON budget_items;

CREATE POLICY "budget_items_select" ON budget_items FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "budget_items_insert" ON budget_items FOR INSERT
  WITH CHECK (
    user_is_household_member(household_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "budget_items_update" ON budget_items FOR UPDATE
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "budget_items_delete" ON budget_items FOR DELETE
  USING (user_is_household_member(household_id, auth.uid()));


-- ─── transactions ─────────────────────────────────────────────────────────────

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "transactions_insert" ON transactions FOR INSERT
  WITH CHECK (
    user_is_household_member(household_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "transactions_update" ON transactions FOR UPDATE
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "transactions_delete" ON transactions FOR DELETE
  USING (user_is_household_member(household_id, auth.uid()));


-- ─── financial_health_snapshots ───────────────────────────────────────────────
-- Written by the server (no user-facing insert), so insert policy is permissive
-- for authenticated members.

ALTER TABLE financial_health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_snapshots_select" ON financial_health_snapshots;
DROP POLICY IF EXISTS "health_snapshots_insert" ON financial_health_snapshots;

CREATE POLICY "health_snapshots_select" ON financial_health_snapshots FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "health_snapshots_insert" ON financial_health_snapshots FOR INSERT
  WITH CHECK (user_is_household_member(household_id, auth.uid()));


-- ─── advisor_insights ─────────────────────────────────────────────────────────

ALTER TABLE advisor_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "advisor_insights_select" ON advisor_insights;
DROP POLICY IF EXISTS "advisor_insights_insert" ON advisor_insights;
DROP POLICY IF EXISTS "advisor_insights_update" ON advisor_insights;
DROP POLICY IF EXISTS "advisor_insights_delete" ON advisor_insights;

CREATE POLICY "advisor_insights_select" ON advisor_insights FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "advisor_insights_insert" ON advisor_insights FOR INSERT
  WITH CHECK (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "advisor_insights_update" ON advisor_insights FOR UPDATE
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "advisor_insights_delete" ON advisor_insights FOR DELETE
  USING (user_is_household_member(household_id, auth.uid()));


-- ─── advisor_conversations ────────────────────────────────────────────────────

ALTER TABLE advisor_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "advisor_conversations_select" ON advisor_conversations;
DROP POLICY IF EXISTS "advisor_conversations_insert" ON advisor_conversations;

CREATE POLICY "advisor_conversations_select" ON advisor_conversations FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "advisor_conversations_insert" ON advisor_conversations FOR INSERT
  WITH CHECK (
    user_is_household_member(household_id, auth.uid())
    AND user_id = auth.uid()
  );


-- ─── advisor_messages ─────────────────────────────────────────────────────────
-- No direct household_id — joins through advisor_conversations.

ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "advisor_messages_select" ON advisor_messages;
DROP POLICY IF EXISTS "advisor_messages_insert" ON advisor_messages;

CREATE POLICY "advisor_messages_select" ON advisor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM advisor_conversations c
      WHERE c.id = advisor_messages.conversation_id
        AND user_is_household_member(c.household_id, auth.uid())
    )
  );

CREATE POLICY "advisor_messages_insert" ON advisor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM advisor_conversations c
      WHERE c.id = advisor_messages.conversation_id
        AND user_is_household_member(c.household_id, auth.uid())
    )
  );


-- ─── scenarios ────────────────────────────────────────────────────────────────

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scenarios_select" ON scenarios;
DROP POLICY IF EXISTS "scenarios_insert" ON scenarios;
DROP POLICY IF EXISTS "scenarios_update" ON scenarios;
DROP POLICY IF EXISTS "scenarios_delete" ON scenarios;

CREATE POLICY "scenarios_select" ON scenarios FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "scenarios_insert" ON scenarios FOR INSERT
  WITH CHECK (
    user_is_household_member(household_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "scenarios_update" ON scenarios FOR UPDATE
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "scenarios_delete" ON scenarios FOR DELETE
  USING (user_is_household_member(household_id, auth.uid()));


-- ─── scenario_items ───────────────────────────────────────────────────────────
-- No direct household_id — joins through scenarios.

ALTER TABLE scenario_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scenario_items_select" ON scenario_items;
DROP POLICY IF EXISTS "scenario_items_insert" ON scenario_items;
DROP POLICY IF EXISTS "scenario_items_update" ON scenario_items;
DROP POLICY IF EXISTS "scenario_items_delete" ON scenario_items;

CREATE POLICY "scenario_items_select" ON scenario_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = scenario_items.scenario_id
        AND user_is_household_member(s.household_id, auth.uid())
    )
  );

CREATE POLICY "scenario_items_insert" ON scenario_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = scenario_items.scenario_id
        AND user_is_household_member(s.household_id, auth.uid())
    )
  );

CREATE POLICY "scenario_items_update" ON scenario_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = scenario_items.scenario_id
        AND user_is_household_member(s.household_id, auth.uid())
    )
  );

CREATE POLICY "scenario_items_delete" ON scenario_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = scenario_items.scenario_id
        AND user_is_household_member(s.household_id, auth.uid())
    )
  );


-- ─── financial_goals ──────────────────────────────────────────────────────────

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_goals_select" ON financial_goals;
DROP POLICY IF EXISTS "financial_goals_insert" ON financial_goals;
DROP POLICY IF EXISTS "financial_goals_update" ON financial_goals;
DROP POLICY IF EXISTS "financial_goals_delete" ON financial_goals;

CREATE POLICY "financial_goals_select" ON financial_goals FOR SELECT
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "financial_goals_insert" ON financial_goals FOR INSERT
  WITH CHECK (
    user_is_household_member(household_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "financial_goals_update" ON financial_goals FOR UPDATE
  USING (user_is_household_member(household_id, auth.uid()));

CREATE POLICY "financial_goals_delete" ON financial_goals FOR DELETE
  USING (user_is_household_member(household_id, auth.uid()));


-- ─── goal_contributions ───────────────────────────────────────────────────────
-- No direct household_id — joins through financial_goals.

ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goal_contributions_select" ON goal_contributions;
DROP POLICY IF EXISTS "goal_contributions_insert" ON goal_contributions;

CREATE POLICY "goal_contributions_select" ON goal_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM financial_goals g
      WHERE g.id = goal_contributions.goal_id
        AND user_is_household_member(g.household_id, auth.uid())
    )
  );

CREATE POLICY "goal_contributions_insert" ON goal_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM financial_goals g
      WHERE g.id = goal_contributions.goal_id
        AND user_is_household_member(g.household_id, auth.uid())
    )
    AND created_by = auth.uid()
  );
