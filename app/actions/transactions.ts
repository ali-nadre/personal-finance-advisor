'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  TransactionWithCategory,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  BudgetVsActual,
} from '@/types/database'
import { getBudgetItems } from './budgets'

// ============ TRANSACTION ACTIONS ============

export async function getTransactions(
  householdId: string,
  filters?: TransactionFilters
) {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('household_id', householdId)

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters?.date_from) {
    query = query.gte('transaction_date', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('transaction_date', filters.date_to)
  }

  const { data, error } = await query.order('transaction_date', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as TransactionWithCategory[], error: null }
}

export async function getTransactionById(transactionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', transactionId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as TransactionWithCategory, error: null }
}

export async function createTransaction(input: CreateTransactionInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      household_id: input.household_id,
      category_id: input.category_id,
      amount: input.amount,
      type: input.type,
      description: input.description || null,
      transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
      is_recurring: input.is_recurring || false,
      recurring_item_id: input.recurring_item_id || null,
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

  return { data: data as TransactionWithCategory, error: null }
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}

  if (input.category_id !== undefined) updateData.category_id = input.category_id
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.type !== undefined) updateData.type = input.type
  if (input.description !== undefined) updateData.description = input.description || null
  if (input.transaction_date !== undefined) updateData.transaction_date = input.transaction_date
  if (input.is_recurring !== undefined) updateData.is_recurring = input.is_recurring

  const { data, error } = await supabase
    .from('transactions')
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

  return { data: data as TransactionWithCategory, error: null }
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ BUDGET VS ACTUAL ============

export async function getBudgetVsActual(
  householdId: string,
  year: number,
  month: number
): Promise<{ data: BudgetVsActual[] | null; error: string | null }> {
  // Get budget items for the year
  const { data: budgetItems, error: budgetError } = await getBudgetItems(householdId, year)

  if (budgetError || !budgetItems) {
    return { data: null, error: budgetError || 'Failed to fetch budget items' }
  }

  // Get actual transactions for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // last day of month

  const { data: transactions, error: txError } = await getTransactions(householdId, {
    date_from: startDate,
    date_to: endDate,
  })

  if (txError) {
    return { data: null, error: txError }
  }

  // Calculate monthly budget per category
  const categoryBudgets = new Map<string, { name: string; type: 'income' | 'expense'; monthly: number }>()

  budgetItems.forEach((item) => {
    let monthlyAmount = item.amount
    if (item.frequency === 'quarterly') {
      monthlyAmount = item.amount / 3
    } else if (item.frequency === 'yearly') {
      monthlyAmount = item.amount / 12
    }

    const existing = categoryBudgets.get(item.category_id)
    if (existing) {
      existing.monthly += monthlyAmount
    } else {
      categoryBudgets.set(item.category_id, {
        name: item.category.name,
        type: item.category.type,
        monthly: monthlyAmount,
      })
    }
  })

  // Calculate actual spending per category
  const categoryActuals = new Map<string, number>()
  transactions?.forEach((tx) => {
    const existing = categoryActuals.get(tx.category_id) || 0
    categoryActuals.set(tx.category_id, existing + tx.amount)
  })

  // Merge into BudgetVsActual results
  const allCategoryIds = new Set([
    ...categoryBudgets.keys(),
    ...categoryActuals.keys(),
  ])

  const results: BudgetVsActual[] = []

  allCategoryIds.forEach((categoryId) => {
    const budget = categoryBudgets.get(categoryId)
    const actual = categoryActuals.get(categoryId) || 0
    const budgeted = budget?.monthly || 0

    // For categories only in transactions but not budget, try to get name from transactions
    let categoryName = budget?.name || ''
    let categoryType: 'income' | 'expense' = budget?.type || 'expense'

    if (!budget) {
      const tx = transactions?.find((t) => t.category_id === categoryId)
      if (tx) {
        categoryName = tx.category.name
        categoryType = tx.category.type
      }
    }

    results.push({
      categoryId,
      categoryName,
      categoryType: categoryType,
      budgeted: Math.round(budgeted * 100) / 100,
      actual: Math.round(actual * 100) / 100,
      difference: Math.round((budgeted - actual) * 100) / 100,
      percentUsed: budgeted > 0 ? Math.round((actual / budgeted) * 100) : actual > 0 ? 100 : 0,
    })
  })

  // Sort: expenses first, then by percent used descending
  results.sort((a, b) => {
    if (a.categoryType !== b.categoryType) {
      return a.categoryType === 'expense' ? -1 : 1
    }
    return b.percentUsed - a.percentUsed
  })

  return { data: results, error: null }
}

// ============ TRANSACTION SUMMARY ============

export interface MonthlyTransactionSummary {
  totalIncome: number
  totalExpense: number
  net: number
  transactionCount: number
}

export async function getMonthlyTransactionSummary(
  householdId: string,
  year: number,
  month: number
): Promise<{ data: MonthlyTransactionSummary | null; error: string | null }> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: transactions, error } = await getTransactions(householdId, {
    date_from: startDate,
    date_to: endDate,
  })

  if (error || !transactions) {
    return { data: null, error: error || 'Failed to fetch transactions' }
  }

  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount
    } else {
      totalExpense += tx.amount
    }
  })

  return {
    data: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      net: Math.round((totalIncome - totalExpense) * 100) / 100,
      transactionCount: transactions.length,
    },
    error: null,
  }
}
