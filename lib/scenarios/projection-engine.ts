import type { ProjectionMonth } from '@/types/database'

export type ProjectionInput = {
  category_type: 'income' | 'expense' | 'savings'
  monthly_amount: number
}

export function runProjection(
  items: ProjectionInput[],
  months: number = 24,
  startDate: Date = new Date()
): ProjectionMonth[] {
  const monthlyIncome = items
    .filter((i) => i.category_type === 'income')
    .reduce((sum, i) => sum + i.monthly_amount, 0)

  const monthlyExpenses = items
    .filter((i) => i.category_type === 'expense' || i.category_type === 'savings')
    .reduce((sum, i) => sum + i.monthly_amount, 0)

  const monthlyNet = monthlyIncome - monthlyExpenses

  const result: ProjectionMonth[] = []
  let cumulative = 0

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    cumulative += monthlyNet

    result.push({
      monthIndex: i,
      label,
      income: monthlyIncome,
      expenses: monthlyExpenses,
      net: monthlyNet,
      cumulativeSavings: cumulative,
    })
  }

  return result
}

export function budgetItemsToScenarioItems(
  budgetItems: { category: { name: string; type: string }; amount: number; frequency: string }[]
): { label: string; category_type: 'income' | 'expense' | 'savings'; monthly_amount: number }[] {
  return budgetItems.map((item) => {
    let monthlyAmount = item.amount
    if (item.frequency === 'quarterly') monthlyAmount = item.amount / 3
    else if (item.frequency === 'yearly') monthlyAmount = item.amount / 12

    return {
      label: item.category.name,
      category_type: item.category.type as 'income' | 'expense' | 'savings',
      monthly_amount: Math.round(monthlyAmount * 100) / 100,
    }
  })
}
