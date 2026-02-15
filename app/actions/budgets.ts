'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Category[], error: null }
}

export async function getCategoriesByType(householdId: string, type: 'income' | 'expense') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .eq('type', type)
    .order('name', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Category[], error: null }
}

export async function createCategory(input: CreateCategoryInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      household_id: input.household_id,
      name: input.name,
      type: input.type,
      icon: input.icon || null,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Category, error: null }
}

export async function updateCategory(input: UpdateCategoryInput) {
  const supabase = await createClient()

  const updateData: any = {
    name: input.name,
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

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Category, error: null }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ BUDGET ITEM ACTIONS ============

export async function getBudgetItems(householdId: string, year?: number) {
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

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as BudgetItemWithCategory[], error: null }
}

export async function getBudgetItemById(itemId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('budget_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', itemId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as BudgetItemWithCategory, error: null }
}

export async function createBudgetItem(input: CreateBudgetItemInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('budget_items')
    .insert({
      household_id: input.household_id,
      category_id: input.category_id,
      amount: input.amount,
      frequency: input.frequency,
      year: input.year,
      description: input.description || null,
      created_by: user.id,
    })
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as BudgetItemWithCategory, error: null }
}

export async function updateBudgetItem(input: UpdateBudgetItemInput) {
  const supabase = await createClient()

  const updateData: any = {}

  if (input.category_id !== undefined) updateData.category_id = input.category_id
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.frequency !== undefined) updateData.frequency = input.frequency
  if (input.year !== undefined) updateData.year = input.year
  if (input.description !== undefined) updateData.description = input.description || null

  const { data, error } = await supabase
    .from('budget_items')
    .update(updateData)
    .eq('id', input.id)
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as BudgetItemWithCategory, error: null }
}

export async function deleteBudgetItem(itemId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('budget_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ BUDGET SUMMARY CALCULATIONS ============

export interface BudgetSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: {
    categoryId: string
    categoryName: string
    categoryType: 'income' | 'expense'
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
  const categoryTotals = new Map<string, { name: string; type: 'income' | 'expense'; total: number }>()

  items.forEach((item) => {
    // Calculate annual amount based on frequency
    let annualAmount = item.amount
    if (item.frequency === 'monthly') {
      annualAmount = item.amount * 12
    } else if (item.frequency === 'quarterly') {
      annualAmount = item.amount * 4
    }

    // Add to totals
    if (item.category.type === 'income') {
      totalIncome += annualAmount
    } else {
      totalExpense += annualAmount
    }

    // Track by category
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
      balance: totalIncome - totalExpense,
      byCategory,
    },
    error: null,
  }
}
