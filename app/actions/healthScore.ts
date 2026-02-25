'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateHealthScore, type HealthScoreResult } from '@/lib/scoring/health-score'
import { getBudgetSummary } from './budgets'
import { getMonthlyTransactionSummary, getBudgetVsActual } from './transactions'

export async function getHealthScore(
  householdId: string
): Promise<{ data: HealthScoreResult | null; error: string | null }> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [
    { data: summary, error: summaryError },
    { data: monthlySummary },
    { data: budgetVsActual },
  ] = await Promise.all([
    getBudgetSummary(householdId, currentYear),
    getMonthlyTransactionSummary(householdId, currentYear, currentMonth),
    getBudgetVsActual(householdId, currentYear, currentMonth),
  ])

  if (summaryError || !summary) {
    return { data: null, error: summaryError || 'Failed to load budget data' }
  }

  // Build expensesByCategory map from budget summary
  const expensesByCategory: Record<string, number> = {}
  summary.byCategory
    .filter((c) => c.categoryType === 'expense')
    .forEach((c) => {
      // Convert annual to monthly for the diversity check
      expensesByCategory[c.categoryName] = c.total / 12
    })

  // Monthly budgeted totals from budgetVsActual
  const monthlyBudgetedExpenses = budgetVsActual
    ?.filter((b) => b.categoryType === 'expense')
    .reduce((sum, b) => sum + b.budgeted, 0)

  const monthlyBudgetedIncome = budgetVsActual
    ?.filter((b) => b.categoryType === 'income')
    .reduce((sum, b) => sum + b.budgeted, 0)

  const result = calculateHealthScore({
    annualIncome: summary.totalIncome,
    annualExpenses: summary.totalExpense,
    expensesByCategory,
    monthlyActualIncome: monthlySummary?.totalIncome,
    monthlyActualExpenses: monthlySummary?.totalExpense,
    monthlyBudgetedIncome,
    monthlyBudgetedExpenses,
  })

  // Persist snapshot (fire and forget — don't block return)
  saveSnapshot(householdId, result).catch(() => {})

  return { data: result, error: null }
}

async function saveSnapshot(householdId: string, result: HealthScoreResult) {
  const supabase = await createClient()

  await supabase.from('financial_health_snapshots').insert({
    household_id: householdId,
    score: result.total,
    savings_rate_score: result.savingsRate.score,
    budget_adherence_score: result.budgetAdherence.score,
    expense_diversity_score: result.expenseDiversity.score,
    income_stability_score: result.incomeStability.score,
    savings_rate: result.savingsRatePercent,
  })
}

export async function getScoreHistory(householdId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('financial_health_snapshots')
    .select('score, calculated_at')
    .eq('household_id', householdId)
    .order('calculated_at', { ascending: false })
    .limit(30)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
