/**
 * Financial Advisor Rule Engine (Free Tier)
 *
 * Analyzes budget + transaction data and generates proactive insights.
 * Each rule returns an insight or null if the condition is not met.
 */

export type InsightType = 'tip' | 'warning' | 'opportunity' | 'milestone'

export interface RuleInput {
  // Annual budget figures
  annualIncome: number
  annualExpenses: number
  // Monthly budget figures (for current month)
  monthlyBudgetedIncome: number
  monthlyBudgetedExpenses: number
  // Actual transaction data for current month
  monthlyActualIncome: number
  monthlyActualExpenses: number
  // Expense breakdown by category (category name → monthly budgeted amount)
  expensesByCategory: Record<string, number>
  // Actual spending by category (category name → amount this month)
  actualByCategory: Record<string, number>
  // Historical context
  previousMonthExpenses?: number
  savingsRatePercent: number
  expenseCategoryCount: number
  incomeCategoryCount: number
}

export interface Insight {
  type: InsightType
  title: string
  body: string
  priority: number   // higher = more urgent (shown first)
}

type Rule = (input: RuleInput) => Insight | null

// ─── Rules ───────────────────────────────────────────────────────────────────

const rules: Rule[] = [

  // 1. Critical: Spending more than earning
  (input) => {
    if (input.annualIncome <= 0) return null
    if (input.annualExpenses > input.annualIncome) {
      const deficit = input.annualExpenses - input.annualIncome
      const pct = Math.round((deficit / input.annualIncome) * 100)
      return {
        type: 'warning',
        title: 'Budget in deficit',
        body: `Your planned expenses exceed income by ${pct}%. This means your budget as planned will leave you short every month. Review your largest expense categories and look for cuts, or find ways to grow income.`,
        priority: 100,
      }
    }
    return null
  },

  // 2. Critical: No savings at all
  (input) => {
    if (input.annualIncome <= 0) return null
    if (input.savingsRatePercent <= 0 && input.annualExpenses > 0) return null // caught by rule 1
    if (input.savingsRatePercent > 0 && input.savingsRatePercent < 1) {
      return {
        type: 'warning',
        title: 'Almost nothing saved each month',
        body: `Your savings rate is under 1% — essentially nothing is being saved. Even saving $50/month builds an emergency cushion over time. Look for one small recurring expense to cut.`,
        priority: 90,
      }
    }
    return null
  },

  // 3. Warning: Low savings rate
  (input) => {
    if (input.annualIncome <= 0) return null
    if (input.savingsRatePercent >= 1 && input.savingsRatePercent < 10) {
      return {
        type: 'warning',
        title: `Low savings rate: ${input.savingsRatePercent.toFixed(1)}%`,
        body: `Financial advisors recommend saving at least 10% of income. You're currently at ${input.savingsRatePercent.toFixed(1)}%. Even small increases — like redirecting one subscription — add up to thousands over a year.`,
        priority: 80,
      }
    }
    return null
  },

  // 4. Opportunity: High savings rate
  (input) => {
    if (input.savingsRatePercent >= 25) {
      return {
        type: 'opportunity',
        title: `Strong savings rate: ${input.savingsRatePercent.toFixed(1)}%`,
        body: `You're saving ${input.savingsRatePercent.toFixed(1)}% of your income — well above the recommended 15-20%. Consider whether this surplus is working for you: an index fund or high-yield savings account could make it grow.`,
        priority: 20,
      }
    }
    return null
  },

  // 5. Warning: Single category dominates expenses (>50%)
  (input) => {
    if (input.annualExpenses <= 0) return null
    const monthlyExpenses = input.annualExpenses / 12
    const dominant = Object.entries(input.expensesByCategory)
      .map(([name, amount]) => ({ name, pct: (amount / monthlyExpenses) * 100 }))
      .sort((a, b) => b.pct - a.pct)[0]
    if (dominant && dominant.pct > 50) {
      return {
        type: 'tip',
        title: `${dominant.name} is ${Math.round(dominant.pct)}% of expenses`,
        body: `${dominant.name} takes up more than half your total budget. While some categories (like housing) are naturally high, it's worth reviewing if there's any flexibility. Reducing it even 5% frees up meaningful money elsewhere.`,
        priority: 60,
      }
    }
    return null
  },

  // 6. Warning: Over budget this month (expenses > 110% of budgeted)
  (input) => {
    if (input.monthlyBudgetedExpenses <= 0 || input.monthlyActualExpenses <= 0) return null
    const ratio = input.monthlyActualExpenses / input.monthlyBudgetedExpenses
    if (ratio > 1.1) {
      const overBy = input.monthlyActualExpenses - input.monthlyBudgetedExpenses
      const pct = Math.round((ratio - 1) * 100)
      return {
        type: 'warning',
        title: `Over budget by ${pct}% this month`,
        body: `You've spent ${pct}% more than planned so far this month (${overBy.toFixed(0)} over budget). Check which categories are running high and consider a spending pause on non-essentials for the rest of the month.`,
        priority: 85,
      }
    }
    return null
  },

  // 7. Tip: Under budget with days left (well under, opportunity to save more)
  (input) => {
    if (input.monthlyBudgetedExpenses <= 0 || input.monthlyActualExpenses <= 0) return null
    const ratio = input.monthlyActualExpenses / input.monthlyBudgetedExpenses
    if (ratio < 0.7) {
      const saved = input.monthlyBudgetedExpenses - input.monthlyActualExpenses
      return {
        type: 'opportunity',
        title: 'Running well under budget',
        body: `You've only spent ${Math.round(ratio * 100)}% of your monthly budget. That's ${saved.toFixed(0)} potentially available — consider moving the surplus to savings or a financial goal before the month ends.`,
        priority: 25,
      }
    }
    return null
  },

  // 8. Warning: Lifestyle creep — expenses grew faster than income
  (input) => {
    if (!input.previousMonthExpenses || input.previousMonthExpenses <= 0) return null
    if (input.monthlyActualExpenses <= 0) return null
    const growth = ((input.monthlyActualExpenses - input.previousMonthExpenses) / input.previousMonthExpenses) * 100
    if (growth > 20) {
      return {
        type: 'warning',
        title: `Spending up ${Math.round(growth)}% from last month`,
        body: `Your spending jumped ${Math.round(growth)}% compared to last month. This could be a one-off expense — but if it's becoming a trend, it's worth checking if lifestyle creep is quietly eroding your savings rate.`,
        priority: 70,
      }
    }
    return null
  },

  // 9. Tip: No income tracked
  (input) => {
    if (input.incomeCategoryCount === 0 || input.annualIncome === 0) {
      return {
        type: 'tip',
        title: 'Add your income sources',
        body: 'Your budget has no income entries. Adding your income (salary, freelance, etc.) unlocks your savings rate, health score, and AI insights. It only takes 30 seconds.',
        priority: 95,
      }
    }
    return null
  },

  // 10. Tip: Very few expense categories (less than 3)
  (input) => {
    if (input.expenseCategoryCount > 0 && input.expenseCategoryCount < 3) {
      return {
        type: 'tip',
        title: 'Expand your expense tracking',
        body: `You're only tracking ${input.expenseCategoryCount} expense categor${input.expenseCategoryCount === 1 ? 'y' : 'ies'}. Breaking expenses into more categories (groceries, transport, subscriptions, etc.) gives you a clearer picture of where money actually goes.`,
        priority: 30,
      }
    }
    return null
  },

  // 11. Opportunity: Good savings rate — suggest investing
  (input) => {
    if (input.savingsRatePercent >= 15 && input.savingsRatePercent < 25) {
      return {
        type: 'opportunity',
        title: 'Good savings rate — put it to work',
        body: `You're saving ${input.savingsRatePercent.toFixed(1)}% of your income. If that surplus is sitting in a regular bank account, consider moving it to a high-yield savings account or index fund to beat inflation.`,
        priority: 15,
      }
    }
    return null
  },

  // 12. Warning: A specific category wildly over budget this month
  (input) => {
    const entries = Object.entries(input.actualByCategory)
    for (const [category, actual] of entries) {
      const budgeted = input.expensesByCategory[category]
      if (!budgeted || budgeted <= 0) continue
      const ratio = actual / budgeted
      if (ratio > 1.5 && actual > 50) { // >50% over AND more than trivial amount
        return {
          type: 'warning',
          title: `${category} is ${Math.round(ratio * 100)}% of budget`,
          body: `You've spent ${Math.round(ratio * 100)}% of your ${category} budget this month. That's ${(actual - budgeted).toFixed(0)} over plan. Consider whether the budget needs adjusting or if this was a one-time expense.`,
          priority: 75,
        }
      }
    }
    return null
  },

  // 13. Milestone: First month logging transactions
  (input) => {
    if (input.monthlyActualExpenses > 0 || input.monthlyActualIncome > 0) {
      // This rule is checked separately — only fires once (handled in server action)
      return null
    }
    return null
  },

  // 14. Tip: Single income source — resilience tip
  (input) => {
    if (input.incomeCategoryCount === 1 && input.annualIncome > 0 && input.savingsRatePercent < 20) {
      return {
        type: 'tip',
        title: 'Single income source',
        body: 'All your income comes from one source. Having only one stream creates vulnerability. Even a small side income (freelance, rental, dividends) adds resilience. Consider what skills or assets could generate extra income.',
        priority: 35,
      }
    }
    return null
  },

  // 15. Opportunity: Healthy budget balance — set a goal
  (input) => {
    if (input.savingsRatePercent >= 10 && input.expenseCategoryCount >= 3) {
      return {
        type: 'opportunity',
        title: 'You\'re ready for a savings goal',
        body: 'Your budget looks healthy. Setting a concrete goal (emergency fund, vacation, debt payoff) gives your savings a purpose and makes it much easier to stay motivated. Goals are coming soon to this platform.',
        priority: 10,
      }
    }
    return null
  },
]

// ─── Main Export ──────────────────────────────────────────────────────────────

export function runRuleEngine(input: RuleInput): Insight[] {
  const results: Insight[] = []

  for (const rule of rules) {
    const insight = rule(input)
    if (insight) {
      results.push(insight)
    }
  }

  // Sort by priority descending, limit to 5 for free tier
  return results
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
}
