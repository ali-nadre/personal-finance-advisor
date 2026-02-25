/**
 * Financial Health Score Engine
 *
 * Calculates a 0-100 score from 4 equally-weighted pillars (25 pts each):
 *   1. Savings Rate    — what % of income is saved
 *   2. Budget Adherence — how close actual spending is to plan
 *   3. Expense Diversity — no single category dominates spending
 *   4. Income Stability  — income entries present and balanced
 */

export interface HealthScoreInput {
  // Annual budget figures (from budget_items)
  annualIncome: number
  annualExpenses: number
  // Expense amounts per category (category name → monthly amount)
  expensesByCategory: Record<string, number>
  // Optional: actual transaction data for this month
  monthlyActualIncome?: number
  monthlyActualExpenses?: number
  monthlyBudgetedIncome?: number
  monthlyBudgetedExpenses?: number
}

export interface HealthScorePillar {
  score: number       // 0-25
  maxScore: number    // always 25
  label: string
  value: string       // human-readable value (e.g. "23%")
  message: string     // explanation of result
  tip: string         // actionable improvement tip
}

export interface HealthScoreResult {
  total: number       // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string       // "Excellent" | "Good" | "Fair" | "Needs Work" | "Critical"
  savingsRate: HealthScorePillar
  budgetAdherence: HealthScorePillar
  expenseDiversity: HealthScorePillar
  incomeStability: HealthScorePillar
  savingsRatePercent: number // raw % for storage
}

// ─── Pillar 1: Savings Rate (25 pts) ─────────────────────────────────────────
// >20%: 25 | 15-20%: 20 | 10-15%: 15 | 5-10%: 10 | 1-5%: 5 | ≤0%: 0
function scoreSavingsRate(annualIncome: number, annualExpenses: number): HealthScorePillar {
  if (annualIncome <= 0) {
    return {
      score: 0, maxScore: 25, label: 'Savings Rate',
      value: 'N/A',
      message: 'No income data found.',
      tip: 'Add your income sources to the budget to calculate your savings rate.',
    }
  }

  const rate = ((annualIncome - annualExpenses) / annualIncome) * 100
  const rateRounded = Math.round(rate * 10) / 10

  let score = 0
  let message = ''
  let tip = ''

  if (rate > 20) {
    score = 25
    message = `You save ${rateRounded}% of your income — excellent.`
    tip = 'Consider investing your surplus for long-term growth.'
  } else if (rate > 15) {
    score = 20
    message = `You save ${rateRounded}% — above the recommended 15%.`
    tip = 'Push to 20%+ by finding one recurring expense to reduce.'
  } else if (rate > 10) {
    score = 15
    message = `You save ${rateRounded}% — close to the 15% target.`
    tip = 'A small increase of 2-3% would put you in the "good" range.'
  } else if (rate > 5) {
    score = 10
    message = `Your ${rateRounded}% savings rate is below recommended levels.`
    tip = 'Aim to save at least 10% of income. Review your top 3 expense categories.'
  } else if (rate > 0) {
    score = 5
    message = `You are only saving ${rateRounded}% of your income.`
    tip = 'Even saving 5% consistently builds a safety net over time.'
  } else {
    score = 0
    message = `Your expenses exceed your income by ${Math.abs(rateRounded)}%.`
    tip = 'Reducing expenses or increasing income is urgent — start with your largest expense category.'
  }

  return { score, maxScore: 25, label: 'Savings Rate', value: `${rateRounded}%`, message, tip }
}

// ─── Pillar 2: Budget Adherence (25 pts) ─────────────────────────────────────
// Uses actual vs budgeted if available; falls back to "budget exists" check
function scoreBudgetAdherence(
  monthlyActualExpenses?: number,
  monthlyBudgetedExpenses?: number,
  annualExpenses?: number
): HealthScorePillar {
  // No budget data at all
  if (!annualExpenses || annualExpenses === 0) {
    return {
      score: 0, maxScore: 25, label: 'Budget Adherence',
      value: 'No budget',
      message: 'You have no expense budget set up.',
      tip: 'Add expense categories and budget amounts to start tracking adherence.',
    }
  }

  // No actual transaction data yet — give partial credit for having a budget
  if (monthlyActualExpenses === undefined || monthlyBudgetedExpenses === undefined || monthlyBudgetedExpenses === 0) {
    return {
      score: 12, maxScore: 25, label: 'Budget Adherence',
      value: 'Budget set',
      message: 'Budget is set up. Log transactions to track adherence.',
      tip: 'Log your daily transactions to get an accurate adherence score.',
    }
  }

  const ratio = monthlyActualExpenses / monthlyBudgetedExpenses
  const percentUsed = Math.round(ratio * 100)

  let score = 0
  let message = ''
  let tip = ''

  if (ratio <= 0.9) {
    score = 25
    message = `You spent ${percentUsed}% of your budget — well under plan.`
    tip = 'Great discipline! Consider moving surplus to savings or a financial goal.'
  } else if (ratio <= 1.0) {
    score = 22
    message = `You spent ${percentUsed}% of your budget — right on track.`
    tip = 'Good adherence. Keep a small buffer (5-10%) for unexpected costs.'
  } else if (ratio <= 1.1) {
    score = 15
    message = `You spent ${percentUsed}% of your budget — slightly over.`
    tip = 'Identify which categories went over and adjust next month\'s plan.'
  } else if (ratio <= 1.25) {
    score = 8
    message = `You spent ${percentUsed}% of your budget — notably over.`
    tip = 'Review your spending by category. Your budget may need to be updated.'
  } else {
    score = 0
    message = `You spent ${percentUsed}% of your budget — significantly over.`
    tip = 'Consider a spending freeze on non-essentials this week to rebalance.'
  }

  return { score, maxScore: 25, label: 'Budget Adherence', value: `${percentUsed}%`, message, tip }
}

// ─── Pillar 3: Expense Diversity (25 pts) ────────────────────────────────────
// Checks if any single category dominates (>50% = bad, >35% = warning)
function scoreExpenseDiversity(
  expensesByCategory: Record<string, number>,
  totalExpenses: number
): HealthScorePillar {
  if (totalExpenses <= 0 || Object.keys(expensesByCategory).length === 0) {
    return {
      score: 0, maxScore: 25, label: 'Expense Diversity',
      value: 'No data',
      message: 'No expense data to evaluate.',
      tip: 'Add expense categories and items to get a diversity score.',
    }
  }

  const shares = Object.entries(expensesByCategory).map(([name, amount]) => ({
    name,
    pct: (amount / totalExpenses) * 100,
  }))

  const maxShare = Math.max(...shares.map((s) => s.pct))
  const dominantCategory = shares.find((s) => s.pct === maxShare)
  const numCategories = shares.length

  let score = 0
  let message = ''
  let tip = ''

  if (maxShare > 60) {
    score = 5
    message = `${dominantCategory?.name} takes up ${Math.round(maxShare)}% of expenses.`
    tip = `High concentration in ${dominantCategory?.name}. Consider whether this can be reduced or offset by income growth.`
  } else if (maxShare > 50) {
    score = 10
    message = `${dominantCategory?.name} takes up ${Math.round(maxShare)}% of expenses.`
    tip = `Try to keep any single category below 50%. Review ${dominantCategory?.name} for savings opportunities.`
  } else if (maxShare > 35) {
    score = 17
    message = `${dominantCategory?.name} is your largest expense at ${Math.round(maxShare)}%.`
    tip = 'Good spread overall. Keeping categories below 35% gives more flexibility.'
  } else if (numCategories >= 4) {
    score = 25
    message = `Well-balanced: no single category exceeds ${Math.round(maxShare)}%.`
    tip = 'Excellent expense balance. This gives you flexibility to handle surprises.'
  } else {
    score = 20
    message = `Balanced spending with ${numCategories} expense categories tracked.`
    tip = 'Consider tracking more categories for a fuller financial picture.'
  }

  return {
    score, maxScore: 25, label: 'Expense Diversity',
    value: `${Math.round(maxShare)}% max`,
    message, tip,
  }
}

// ─── Pillar 4: Income Stability (25 pts) ─────────────────────────────────────
// Checks: income exists, income > expenses, multiple income sources = bonus
function scoreIncomeStability(
  annualIncome: number,
  annualExpenses: number,
  incomeCategoryCount: number
): HealthScorePillar {
  if (annualIncome <= 0) {
    return {
      score: 0, maxScore: 25, label: 'Income Stability',
      value: 'No income',
      message: 'No income sources have been added.',
      tip: 'Add your income sources (salary, freelance, etc.) to the budget.',
    }
  }

  let score = 0
  let message = ''
  let tip = ''

  const coverageRatio = annualIncome / Math.max(annualExpenses, 1)
  const multiple = incomeCategoryCount > 1

  if (coverageRatio >= 1.3 && multiple) {
    score = 25
    message = `Strong: income covers ${Math.round(coverageRatio * 100)}% of expenses with multiple sources.`
    tip = 'Multiple income streams and a strong coverage ratio — excellent financial resilience.'
  } else if (coverageRatio >= 1.3) {
    score = 20
    message = `Your income covers ${Math.round(coverageRatio * 100)}% of expenses.`
    tip = 'Consider adding a second income stream (side income, investments) for extra resilience.'
  } else if (coverageRatio >= 1.1) {
    score = 15
    message = `Income covers ${Math.round(coverageRatio * 100)}% of expenses — a small buffer.`
    tip = 'A 20-30% income-to-expense buffer is healthier. Look for ways to increase income or trim expenses.'
  } else if (coverageRatio >= 1.0) {
    score = 8
    message = `Income barely covers expenses at ${Math.round(coverageRatio * 100)}%.`
    tip = 'Very little room for error. Any unexpected expense could create deficit. Build a buffer.'
  } else {
    score = 0
    message = `Income covers only ${Math.round(coverageRatio * 100)}% of planned expenses.`
    tip = 'Your budget is in deficit. Prioritize reducing expenses or finding additional income.'
  }

  return {
    score, maxScore: 25, label: 'Income Stability',
    value: `${Math.round(coverageRatio * 100)}%`,
    message, tip,
  }
}

// ─── Grade ────────────────────────────────────────────────────────────────────
function getGrade(total: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; label: string } {
  if (total >= 85) return { grade: 'A', label: 'Excellent' }
  if (total >= 70) return { grade: 'B', label: 'Good' }
  if (total >= 55) return { grade: 'C', label: 'Fair' }
  if (total >= 40) return { grade: 'D', label: 'Needs Work' }
  return { grade: 'F', label: 'Critical' }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const {
    annualIncome,
    annualExpenses,
    expensesByCategory,
    monthlyActualIncome,
    monthlyActualExpenses,
    monthlyBudgetedIncome,
    monthlyBudgetedExpenses,
  } = input

  const incomeCategoryCount = Object.keys(expensesByCategory).length > 0 ? 1 : 0

  const savingsRate = scoreSavingsRate(annualIncome, annualExpenses)
  const budgetAdherence = scoreBudgetAdherence(
    monthlyActualExpenses,
    monthlyBudgetedExpenses,
    annualExpenses
  )
  const expenseDiversity = scoreExpenseDiversity(expensesByCategory, annualExpenses / 12)
  const incomeStability = scoreIncomeStability(annualIncome, annualExpenses, incomeCategoryCount)

  const total = savingsRate.score + budgetAdherence.score + expenseDiversity.score + incomeStability.score
  const { grade, label } = getGrade(total)

  const savingsRatePercent =
    annualIncome > 0
      ? Math.round(((annualIncome - annualExpenses) / annualIncome) * 1000) / 10
      : 0

  return {
    total,
    grade,
    label,
    savingsRate,
    budgetAdherence,
    expenseDiversity,
    incomeStability,
    savingsRatePercent,
  }
}
