-- ============================================================
-- Migration 016: Add 'savings' as a valid category type
-- ============================================================
-- The categories table has a CHECK constraint limiting type to
-- 'income' | 'expense'. This migration adds 'savings'.
--
-- HOW TO APPLY:
--   Paste this entire file into the Supabase SQL Editor and click Run.
-- ============================================================

-- Drop the old constraint and recreate it with 'savings' included
ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_type_check;

ALTER TABLE categories
  ADD CONSTRAINT categories_type_check
  CHECK (type IN ('income', 'expense', 'savings'));
