'use server'

import { createClient } from '@/lib/supabase/server'
import { getBudgetItems } from './budgets'
import { budgetItemsToScenarioItems } from '@/lib/scenarios/projection-engine'
import type { Scenario, ScenarioItem, ScenarioWithItems, CreateScenarioInput, AddScenarioItemInput } from '@/types/database'

export async function createScenario(
  input: CreateScenarioInput,
  cloneFromBudget = false
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .insert({
      household_id: input.household_id,
      name: input.name,
      description: input.description || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Scenario[], error: null }
}

export async function getScenario(scenarioId: string) {
  const supabase = await createClient()

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single()

  if (sErr) return { data: null, error: sErr.message }

  const { data: items, error: iErr } = await supabase
    .from('scenario_items')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('category_type', { ascending: false }) // income first
    .order('sort_order', { ascending: true })

  if (iErr) return { data: null, error: iErr.message }

  return {
    data: { ...scenario, items: items ?? [] } as ScenarioWithItems,
    error: null,
  }
}

export async function addScenarioItem(input: AddScenarioItemInput) {
  const supabase = await createClient()

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
      label: input.label,
      category_type: input.category_type,
      monthly_amount: input.monthly_amount,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ScenarioItem, error: null }
}

export async function deleteScenarioItem(itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('scenario_items').delete().eq('id', itemId)
  return { error: error?.message ?? null }
}

export async function archiveScenario(scenarioId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scenarios')
    .update({ is_archived: true })
    .eq('id', scenarioId)
  return { error: error?.message ?? null }
}

export async function updateScenarioName(scenarioId: string, name: string, description?: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scenarios')
    .update({ name, description: description ?? null })
    .eq('id', scenarioId)
  return { error: error?.message ?? null }
}
