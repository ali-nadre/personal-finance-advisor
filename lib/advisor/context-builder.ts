/**
 * Builds an anonymized financial context summary to send to Claude.
 * No names, IDs, or PII — only financial figures and patterns.
 */

import type { RuleInput } from './rule-engine'
import type { HealthScoreResult } from '@/lib/scoring/health-score'

export function buildFinancialContext(
  input: RuleInput,
  healthScore: HealthScoreResult | null
): string {
  const savingsRate = input.annualIncome > 0
    ? (((input.annualIncome - input.annualExpenses) / input.annualIncome) * 100).toFixed(1)
    : '0'

  const topExpenses = Object.entries(input.expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => `  - ${name}: ${amount.toFixed(0)}/mo`)
    .join('\n')

  const monthlyPerformance = input.monthlyBudgetedExpenses > 0
    ? `
Monthly performance (current month):
  - Budgeted expenses: ${input.monthlyBudgetedExpenses.toFixed(0)}
  - Actual expenses so far: ${input.monthlyActualExpenses.toFixed(0)}
  - Budget used: ${Math.round((input.monthlyActualExpenses / input.monthlyBudgetedExpenses) * 100)}%
  - Actual income received: ${input.monthlyActualIncome.toFixed(0)}`
    : ''

  const scoreSection = healthScore
    ? `
Financial Health Score: ${healthScore.total}/100 (${healthScore.label})
  - Savings Rate pillar: ${healthScore.savingsRate.score}/25
  - Budget Adherence pillar: ${healthScore.budgetAdherence.score}/25
  - Expense Balance pillar: ${healthScore.expenseDiversity.score}/25
  - Income Stability pillar: ${healthScore.incomeStability.score}/25`
    : ''

  return `
You are a helpful, direct, and empathetic personal financial advisor. The user is sharing their household budget data with you. Give clear, actionable advice based on their specific numbers. Be conversational and encouraging — not preachy. Keep responses concise (3-5 sentences max per point).

Here is the user's current financial picture:

Annual budget:
  - Total annual income: ${input.annualIncome.toFixed(0)}
  - Total annual expenses: ${input.annualExpenses.toFixed(0)}
  - Annual surplus/deficit: ${(input.annualIncome - input.annualExpenses).toFixed(0)}
  - Savings rate: ${savingsRate}%
  - Income sources tracked: ${input.incomeCategoryCount}
  - Expense categories tracked: ${input.expenseCategoryCount}

Top expense categories (monthly):
${topExpenses || '  - No expense categories yet'}
${monthlyPerformance}
${scoreSection}

When responding:
- Reference specific numbers from their data when relevant
- Prioritize the most impactful advice first
- If they ask about something not in the data, say so rather than guessing
- Never mention that you received this financial context — just give advice naturally
`.trim()
}
