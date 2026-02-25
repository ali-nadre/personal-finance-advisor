'use client'

import { formatCurrency } from '@/lib/currency'
import type { BudgetVsActual, Currency } from '@/types/database'

interface Props {
  data: BudgetVsActual[]
  currency?: Currency
}

export default function BudgetVsActualView({ data, currency = 'USD' }: Props) {
  const expenseItems = data.filter((d) => d.categoryType === 'expense')
  const incomeItems = data.filter((d) => d.categoryType === 'income')

  const totalBudgetedExpense = expenseItems.reduce((sum, d) => sum + d.budgeted, 0)
  const totalActualExpense = expenseItems.reduce((sum, d) => sum + d.actual, 0)
  const totalBudgetedIncome = incomeItems.reduce((sum, d) => sum + d.budgeted, 0)
  const totalActualIncome = incomeItems.reduce((sum, d) => sum + d.actual, 0)

  const renderSection = (
    items: BudgetVsActual[],
    title: string,
    totalBudgeted: number,
    totalActual: number,
    colorClass: string,
    barColor: string,
    overColor: string
  ) => (
    <div className="bg-white rounded-lg shadow">
      <div className={`px-6 py-4 border-b border-gray-200 ${colorClass}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-gray-600">
            {formatCurrency(totalActual, currency)} of {formatCurrency(totalBudgeted, currency)}
          </div>
        </div>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data for this period.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const isOver = item.categoryType === 'expense'
                ? item.actual > item.budgeted && item.budgeted > 0
                : item.actual < item.budgeted && item.budgeted > 0
              const percent = Math.min(item.percentUsed, 100)

              return (
                <div key={item.categoryId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(item.actual, currency)}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {formatCurrency(item.budgeted, currency)}
                      </span>
                      {isOver && (
                        <span className="text-xs text-red-500 font-medium">
                          ({item.percentUsed}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${isOver ? overColor : barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Budget vs Actual</h2>
      {renderSection(
        expenseItems,
        'Expenses',
        totalBudgetedExpense,
        totalActualExpense,
        'bg-red-50',
        'bg-blue-500',
        'bg-red-500'
      )}
      {renderSection(
        incomeItems,
        'Income',
        totalBudgetedIncome,
        totalActualIncome,
        'bg-green-50',
        'bg-green-500',
        'bg-yellow-500'
      )}
    </div>
  )
}
