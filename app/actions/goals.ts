'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  FinancialGoal,
  GoalContribution,
  CreateGoalInput,
  AddContributionInput,
} from '@/types/database'

export async function createGoal(input: CreateGoalInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('financial_goals')
    .insert({
      household_id: input.household_id,
      name: input.name,
      description: input.description || null,
      goal_type: input.goal_type,
      target_amount: input.target_amount,
      current_amount: input.current_amount ?? 0,
      deadline: input.deadline || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as FinancialGoal, error: null }
}

export async function getGoals(householdId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as FinancialGoal[], error: null }
}

export async function getGoalContributions(goalId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contributed_at', { ascending: false })
    .limit(20)

  if (error) return { data: null, error: error.message }
  return { data: data as GoalContribution[], error: null }
}

export async function addContribution(input: AddContributionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch current amount first
  const { data: goal, error: fetchErr } = await supabase
    .from('financial_goals')
    .select('current_amount, target_amount')
    .eq('id', input.goal_id)
    .single()

  if (fetchErr || !goal) return { error: 'Goal not found' }

  // Insert contribution record
  const { error: contribErr } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: input.goal_id,
      amount: input.amount,
      note: input.note || null,
      contributed_at: input.contributed_at ?? new Date().toISOString().split('T')[0],
      created_by: user.id,
    })

  if (contribErr) return { error: contribErr.message }

  // Increment current_amount; auto-complete if reached target
  const newAmount = goal.current_amount + input.amount
  const isCompleted = newAmount >= goal.target_amount

  const { error: updateErr } = await supabase
    .from('financial_goals')
    .update({
      current_amount: newAmount,
      ...(isCompleted ? { is_completed: true } : {}),
    })
    .eq('id', input.goal_id)

  return { error: updateErr?.message ?? null }
}

export async function archiveGoal(goalId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_goals')
    .update({ is_archived: true })
    .eq('id', goalId)
  return { error: error?.message ?? null }
}

export async function markGoalComplete(goalId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_goals')
    .update({ is_completed: true })
    .eq('id', goalId)
  return { error: error?.message ?? null }
}
