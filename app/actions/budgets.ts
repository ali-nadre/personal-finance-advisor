'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireHouseholdMember } from '@/lib/auth-guard'
import type {
  Category,
  BudgetItem,
  BudgetItemWithCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateBudgetItemInput,
  UpdateBudgetItemInput,
} from '@/types/database'

// ============ CATEGORY ACTIONS ============

export async function getCategories(householdId: string) {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) return { data: null, error: 'Failed to fetch categories' }
  return { data: data as Category[], error: null }
}

export async function getCategoriesByType(householdId: string, type: 'income' | 'expense') {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .eq('type', type)
    .order('name', { ascending: true })

  if (error) return { data: null, error: 'Failed to fetch categories' }
  return { data: data as Category[], error: null }
}

export async function createCategory(input: CreateCategoryInput) {
  const { error: authError } = await requireHouseholdMember(input.household_id)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({
      household_id: input.household_id,
      name: input.name.trim().slice(0, 100),
      type: input.type,
      icon: input.icon || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Failed to create category' }
  return { data: data as Category, error: null }
}

export async function updateCategory(input: UpdateCategoryInput) {
  const { error: authError } = await requireAuth()
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('categories')
    .select('household_id')
    .eq('id', input.id)
    .single()

  if (!existing) return { data: null, error: 'Category not found' }

  const { error: memberError } = await requireHouseholdMember(existing.household_id)
  if (memberError) return { data: null, error: memberError }

  const updateData: Record<string, unknown> = {
    name: input.name.trim().slice(0, 100),
  }
  if (input.icon !== undefined) {
    updateData.icon = input.icon || null
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) return { data: null, error: 'Failed to update category' }
  return { data: data as Category, error: null }
}

export async function deleteCategory(categoryId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('categories')
    .select('household_id')
    .eq('id', categoryId)
    .single()

  if (!existing) return { error: 'Category not found' }

  const { error: memberError } = await requireHouseholdMember(existing.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) return { error: 'Failed to delete category' }
  return { error: null }
}

// ============ BUDGET ITEM ACTIONS ============

export async function getBudgetItems(householdId: string, year?: number) {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  let query = supabase
    .from('budget_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('household_id', householdId)

  if (year) {
    query = query.eq('year', year)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Failed to fetch budget items' }
  return { data: data as BudgetItemWithCategory[], error: null }
}

export async function getBudgetItemById(itemId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', itemId)
    .single()

  if (error) return { data: null, error: 'Budget item not found' }

  const { error: memberError } = await requireHouseholdMember(data.household_id)
  if (memberError) return { data: null, error: memberError }

  return { data: data as BudgetItemWithCategory, error: null }
}

export async function createBudgetItem(input: CreateBudgetItemInput) {
  const { user, error: authError } = await requireHouseholdMember(input.household_id)
  if (authError || !user) return { data: null, error: authError || 'Not authenticated' }

  if (!input.amount || input.amount <= 0 || input.amount > 999_999_999 || !isFinite(input.amount)) {
    return { data: null, error: 'Invalid amount' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_items')
    .insert({
      household_id: input.household_id,
      category_id: input.category_id,
      amount: input.amount,
      frequency: input.frequency,
      year: input.year,
      description: input.description?.trim().slice(0, 500) || null,
      created_by: user.id,
    })
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) return { data: null, error: 'Failed to create budget item' }
  return { data: data as BudgetItemWithCategory, error: null }
}

export async function updateBudgetItem(input: UpdateBudgetItemInput) {
  const { error: authError } = await requireAuth()
  if (authError) return { data: null, error: authError }

  if (input.amount !== undefined && (input.amount <= 0 || input.amount > 999_999_999 || !isFinite(input.amount))) {
    return { data: null, error: 'Invalid amount' }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('budget_items')
    .select('household_id')
    .eq('id', input.id)
    .single()

  if (!existing) return { data: null, error: 'Budget item not found' }

  const { error: memberError } = await requireHouseholdMember(existing.household_id)
  if (memberError) return { data: null, error: memberError }

  const updateData: Record<string, unknown> = {}
  if (input.category_id !== undefined) updateData.category_id = input.category_id
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.frequency !== undefined) updateData.frequency = input.frequency
  if (input.year !== undefined) updateData.year = input.year
  if (input.description !== undefined) updateData.description = input.description?.trim().slice(0, 500) || null

  const { data, error } = await supabase
    .from('budget_items')
    .update(updateData)
    .eq('id', input.id)
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) return { data: null, error: 'Failed to update budget item' }
  return { data: data as BudgetItemWithCategory, error: null }
}

export async function deleteBudgetItem(itemId: string) {
  const { error: authError } = await requireAuth()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('budget_items')
    .select('household_id')
    .eq('id', itemId)
    .single()

  if (!existing) return { error: 'Budget item not found' }

  const { error: memberError } = await requireHouseholdMember(existing.household_id)
  if (memberError) return { error: memberError }

  const { error } = await supabase
    .from('budget_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: 'Failed to delete budget item' }
  return { error: null }
}

// ============ BUDGET SUMMARY CALCULATIONS ============

export interface BudgetSummary {
  totalIncome: number
  totalExpense: number
  totalSavings: number
  balance: number
  byCategory: {
    categoryId: string
    categoryName: string
    categoryType: 'income' | 'expense' | 'savings'
    total: number
  }[]
}

export async function getBudgetSummary(householdId: string, year: number): Promise<{ data: BudgetSummary | null; error: string | null }> {
  const { data: items, error } = await getBudgetItems(householdId, year)

  if (error || !items) {
    return { data: null, error: error || 'Failed to fetch budget items' }
  }

  let totalIncome = 0
  let totalExpense = 0
  let totalSavings = 0
  const categoryTotals = new Map<string, { name: string; type: 'income' | 'expense' | 'savings'; total: number }>()

  items.forEach((item) => {
    let annualAmount = item.amount
    if (item.frequency === 'monthly') {
      annualAmount = item.amount * 12
    } else if (item.frequency === 'quarterly') {
      annualAmount = item.amount * 4
    }

    if (item.category.type === 'income') {
      totalIncome += annualAmount
    } else if (item.category.type === 'savings') {
      totalSavings += annualAmount
    } else {
      totalExpense += annualAmount
    }

    const existing = categoryTotals.get(item.category_id)
    if (existing) {
      existing.total += annualAmount
    } else {
      categoryTotals.set(item.category_id, {
        name: item.category.name,
        type: item.category.type,
        total: annualAmount,
      })
    }
  })

  const byCategory = Array.from(categoryTotals.entries()).map(([categoryId, data]) => ({
    categoryId,
    categoryName: data.name,
    categoryType: data.type,
    total: data.total,
  }))

  return {
    data: {
      totalIncome,
      totalExpense,
      totalSavings,
      balance: totalIncome - totalExpense - totalSavings,
      byCategory,
    },
    error: null,
  }
}

// ============ YEAR BALANCE ACTIONS ============

export async function getYearBalance(householdId: string, year: number): Promise<{ data: number | null; error: string | null }> {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { data: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('household_year_balances')
    .select('beginning_balance')
    .eq('household_id', householdId)
    .eq('year', year)
    .maybeSingle()

  if (error) return { data: null, error: 'Failed to fetch year balance' }
  return { data: data?.beginning_balance ?? null, error: null }
}

export async function upsertYearBalance(householdId: string, year: number, beginningBalance: number): Promise<{ error: string | null }> {
  const { error: authError } = await requireHouseholdMember(householdId)
  if (authError) return { error: authError }

  if (!isFinite(beginningBalance) || Math.abs(beginningBalance) > 999_999_999_999) {
    return { error: 'Invalid balance amount' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('household_year_balances')
    .upsert(
      { household_id: householdId, year, beginning_balance: beginningBalance, updated_at: new Date().toISOString() },
      { onConflict: 'household_id,year' }
    )

  if (error) return { error: 'Failed to save year balance' }
  return { error: null }
}

// ============ COPY BUDGET ITEMS ============

export async function copyBudgetItems(
  householdId: string,
  itemIds: string[],
  targetYear: number
): Promise<{ copied: number; skipped: number; error: string | null }> {
  const { user, error: authError } = await requireHouseholdMember(householdId)
  if (authError || !user) return { copied: 0, skipped: 0, error: authError || 'Not authenticated' }

  if (itemIds.length === 0) return { copied: 0, skipped: 0, error: null }

  const supabase = await createClient()

  // Fetch source items
  const { data: sourceItems, error: fetchError } = await supabase
    .from('budget_items')
    .select('*')
    .in('id', itemIds)
    .eq('household_id', householdId)

  if (fetchError || !sourceItems) return { copied: 0, skipped: 0, error: 'Failed to fetch source items' }

  // Fetch existing items in target year to detect duplicates
  const { data: existingItems } = await supabase
    .from('budget_items')
    .select('category_id, frequency, amount')
    .eq('household_id', householdId)
    .eq('year', targetYear)

  const existingSet = new Set(
    (existingItems ?? []).map((i) => `${i.category_id}|${i.frequency}|${i.amount}`)
  )

  const toInsert = sourceItems
    .filter((item) => !existingSet.has(`${item.category_id}|${item.frequency}|${item.amount}`))
    .map((item) => ({
      household_id: householdId,
      category_id: item.category_id,
      amount: item.amount,
      frequency: item.frequency,
      year: targetYear,
      description: item.description,
      created_by: user.id,
    }))

  const skipped = sourceItems.length - toInsert.length

  if (toInsert.length === 0) return { copied: 0, skipped, error: null }

  const { error: insertError } = await supabase.from('budget_items').insert(toInsert)
  if (insertError) return { copied: 0, skipped, error: 'Failed to copy items' }

  return { copied: toInsert.length, skipped, error: null }
}
