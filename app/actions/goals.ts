'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireHouseholdMember } from '@/lib/auth-guard'
import type {
  FinancialGoal,
  GoalContribution,
  CreateGoalInput,
  AddContributionInput,
} from '@/types/database'

export async function createGoal(input: CreateGoalInput) {
  const { user, error: authError } = await requireHouseholdMember(input.household_id)
  if (authError || !user) return { data: null, error: authError || 'Not authenticated' }

  if (!input.target_amount || input.target_amount <= 0 || input.target_amount > 999_999_999 || !isFinite(input.target_amount)) {
    return { data: null, error: 'Invalid target amount' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_goals')
    .insert({
      household_id: input.household_id,
      name: input.name.trim().slice(0, 200),
      description: input.description?.trim().slice(0, 500) || null,
      goal_type: input.goal_type,
      target_amount: input.target_amount,
      current_amount: Math.max(0, input.current_amount ?? 0),
      deadline: input.deadline || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Failed to create goal' }
  return { data: data as FinancialGoal, error: null }
}

export async function getGoals(householdId: string) {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Failed to fetch goals' }
  return { data: data as FinancialGoal[], error: null }
}

export async function getGoalContributions(goalId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()

  // Verify goal ownership
  const { data: goal } = await supabase
    .from('financial_goals')
    .select('household_id')
    .eq('id', goalId)
    .single()

  if (!goal) return { data: null, error: 'Goal not found' }

  const { error: memberError } = await requireHouseholdMember(goal.household_id)
  if (memberError) return { data: null, error: memberError }

  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contributed_at', { ascending: false })
    .limit(20)

  if (error) return { data: null, error: 'Failed to fetch contributions' }
  return { data: data as GoalContribution[], error: null }
}

export async function addContribution(input: AddContributionInput) {
  const { user, error: authError } = await requireAuth()
  if (authError || !user) return { error: authError || 'Not authenticated' }

  if (!input.amount || input.amount <= 0 || input.amount > 999_999_999 || !isFinite(input.amount)) {
    return { error: 'Invalid amount' }
  }

  const supabase = await createClient()

  // Fetch goal and verify ownership
  const { data: goal, error: fetchErr } = await supabase
    .from('financial_goals')
    .select('current_amount, target_amount, household_id')
    .eq('id', input.goal_id)
    .single()

  if (fetchErr || !goal) return { error: 'Goal not found' }

  const { error: memberError } = await requireHouseholdMember(goal.household_id)
  if (memberError) return { error: memberError }

  const { error: contribErr } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: input.goal_id,
      amount: input.amount,
      note: input.note?.trim().slice(0, 500) || null,
      contributed_at: input.contributed_at ?? new Date().toISOString().split('T')[0],
      created_by: user.id,
    })

  if (contribErr) return { error: 'Failed to add contribution' }

  const newAmount = goal.current_amount + input.amount
  const isCompleted = newAmount >= goal.target_amount

  const { error: updateErr } = await supabase
    .from('financial_goals')
    .update({
      current_amount: newAmount,
      ...(isCompleted ? { is_completed: true } : {}),
    })
    .eq('id', input.goal_id)

  return { error: updateErr ? 'Failed to update goal' : null }
}

export async function archiveGoal(goalId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: goal } = await supabase
    .from('financial_goals')
    .select('household_id')
    .eq('id', goalId)
    .single()

  if (!goal) return { error: 'Goal not found' }

  const { error: memberError } = await requireHouseholdMember(goal.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('financial_goals')
    .update({ is_archived: true })
    .eq('id', goalId)
  return { error: error ? 'Failed to archive goal' : null }
}

export async function markGoalComplete(goalId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: goal } = await supabase
    .from('financial_goals')
    .select('household_id')
    .eq('id', goalId)
    .single()

  if (!goal) return { error: 'Goal not found' }

  const { error: memberError } = await requireHouseholdMember(goal.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('financial_goals')
    .update({ is_completed: true })
    .eq('id', goalId)
  return { error: error ? 'Failed to complete goal' : null }
}
