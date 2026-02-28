import type { BudgetSummary as BudgetSummaryType } from '@/app/actions/budgets'
import type { Currency } from '@/types/database'
import { formatCurrency } from '@/lib/currency'

interface Props {
  summary: BudgetSummaryType
  currency?: Currency
  viewMode?: 'yearly' | 'monthly'
  labels?: {
    totalIncome: string
    totalExpenses: string
    balance: string
    projection: string
    surplus: string
    deficit: string
  }
}

export default function BudgetSummary({
  summary,
  currency = 'USD',
  viewMode = 'yearly',
  labels,
}: Props) {
  const divisor = viewMode === 'monthly' ? 12 : 1
  const income = summary.totalIncome / divisor
  const expenses = summary.totalExpense / divisor
  const balance = summary.balance / divisor

  const l = labels ?? {
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    balance: 'Balance',
    projection: viewMode === 'monthly' ? 'Monthly average' : 'Annual projection',
    surplus: 'Surplus',
    deficit: 'Deficit',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.totalIncome}</h3>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(income, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{l.projection}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.totalExpenses}</h3>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
          {formatCurrency(expenses, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{l.projection}</p>
      </div>

      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${
        balance >= 0 ? 'border-blue-500' : 'border-orange-500'
      }`}>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.balance}</h3>
        <p className={`text-3xl font-bold ${
          balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
        }`}>
          {formatCurrency(balance, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {balance >= 0 ? l.surplus : l.deficit}
        </p>
      </div>
    </div>
  )
}
