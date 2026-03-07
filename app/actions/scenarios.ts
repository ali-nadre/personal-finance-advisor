'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireHouseholdMember } from '@/lib/auth-guard'
import { getBudgetItems } from './budgets'
import { budgetItemsToScenarioItems } from '@/lib/scenarios/projection-engine'
import type { Scenario, ScenarioItem, ScenarioWithItems, CreateScenarioInput, AddScenarioItemInput } from '@/types/database'

export async function createScenario(
  input: CreateScenarioInput,
  cloneFromBudget = false
) {
  const { user, error: authError } = await requireHouseholdMember(input.household_id)
  if (authError || !user) return { data: null, error: authError || 'Not authenticated' }

  const supabase = await createClient()
  const { data: scenario, error } = await supabase
    .from('scenarios')
    .insert({
      household_id: input.household_id,
      name: input.name.trim().slice(0, 200),
      description: input.description?.trim().slice(0, 500) || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Failed to create scenario' }

  if (cloneFromBudget) {
    const year = new Date().getFullYear()
    const { data: budgetItems } = await getBudgetItems(input.household_id, year)

    if (budgetItems && budgetItems.length > 0) {
      const clonedItems = budgetItemsToScenarioItems(budgetItems)
      const rows = clonedItems.map((item, idx) => ({
        scenario_id: scenario.id,
        label: item.label,
        category_type: item.category_type,
        monthly_amount: item.monthly_amount,
        sort_order: idx,
      }))
      await supabase.from('scenario_items').insert(rows)
    }
  }

  return { data: scenario as Scenario, error: null }
}

export async function getScenarios(householdId: string) {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Failed to fetch scenarios' }
  return { data: data as Scenario[], error: null }
}

export async function getScenario(scenarioId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single()

  if (sErr) return { data: null, error: 'Scenario not found' }

  const { error: memberError } = await requireHouseholdMember(scenario.household_id)
  if (memberError) return { data: null, error: memberError }

  const { data: items, error: iErr } = await supabase
    .from('scenario_items')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('category_type', { ascending: false })
    .order('sort_order', { ascending: true })

  if (iErr) return { data: null, error: 'Failed to fetch scenario items' }

  return {
    data: { ...scenario, items: items ?? [] } as ScenarioWithItems,
    error: null,
  }
}

export async function addScenarioItem(input: AddScenarioItemInput) {
  const { error: authError } = await requireAuth()
  if (authError) return { data: null, error: authError }

  if (!input.monthly_amount || input.monthly_amount <= 0 || input.monthly_amount > 999_999_999 || !isFinite(input.monthly_amount)) {
    return { data: null, error: 'Invalid amount' }
  }

  const supabase = await createClient()

  // Verify scenario ownership
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('household_id')
    .eq('id', input.scenario_id)
    .single()

  if (!scenario) return { data: null, error: 'Scenario not found' }

  const { error: memberError } = await requireHouseholdMember(scenario.household_id)
  if (memberError) return { data: null, error: memberError }

  const { data: existing } = await supabase
    .from('scenario_items')
    .select('sort_order')
    .eq('scenario_id', input.scenario_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = existing ? (existing.sort_order ?? 0) + 1 : 0

  const { data, error } = await supabase
    .from('scenario_items')
    .insert({
      scenario_id: input.scenario_id,
      label: input.label.trim().slice(0, 200),
      category_type: input.category_type,
      monthly_amount: input.monthly_amount,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Failed to add scenario item' }
  return { data: data as ScenarioItem, error: null }
}

export async function updateScenarioItem(
  itemId: string,
  label: string,
  monthly_amount: number
) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  if (monthly_amount <= 0 || monthly_amount > 999_999_999 || !isFinite(monthly_amount)) {
    return { error: 'Invalid amount' }
  }

  const supabase = await createClient()

  // Verify ownership chain: item -> scenario -> household
  const { data: item } = await supabase
    .from('scenario_items')
    .select('scenario_id')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Scenario item not found' }

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('household_id')
    .eq('id', item.scenario_id)
    .single()

  if (!scenario) return { error: 'Scenario not found' }

  const { error: memberError } = await requireHouseholdMember(scenario.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('scenario_items')
    .update({ label: label.trim().slice(0, 200), monthly_amount })
    .eq('id', itemId)
  return { error: error ? 'Failed to update scenario item' : null }
}

export async function deleteScenarioItem(itemId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()

  const { data: item } = await supabase
    .from('scenario_items')
    .select('scenario_id')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Scenario item not found' }

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('household_id')
    .eq('id', item.scenario_id)
    .single()

  if (!scenario) return { error: 'Scenario not found' }

  const { error: memberError } = await requireHouseholdMember(scenario.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase.from('scenario_items').delete().eq('id', itemId)
  return { error: error ? 'Failed to delete scenario item' : null }
}

export async function archiveScenario(scenarioId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('household_id')
    .eq('id', scenarioId)
    .single()

  if (!scenario) return { error: 'Scenario not found' }

  const { error: memberError } = await requireHouseholdMember(scenario.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('scenarios')
    .update({ is_archived: true })
    .eq('id', scenarioId)
  return { error: error ? 'Failed to archive scenario' : null }
}

export async function updateScenarioName(scenarioId: string, name: string, description?: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('household_id')
    .eq('id', scenarioId)
    .single()

  if (!scenario) return { error: 'Scenario not found' }

  const { error: memberError } = await requireHouseholdMember(scenario.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('scenarios')
    .update({ name: name.trim().slice(0, 200), description: description?.trim().slice(0, 500) ?? null })
    .eq('id', scenarioId)
  return { error: error ? 'Failed to update scenario' : null }
}
