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
    totalSavings: string
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
  const savings = summary.totalSavings / divisor
  const balance = summary.balance / divisor

  const l = labels ?? {
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    totalSavings: 'Total Savings',
    balance: 'Balance',
    projection: viewMode === 'monthly' ? 'Monthly average' : 'Annual projection',
    surplus: 'Surplus',
    deficit: 'Deficit',
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border-l-4 border-green-500">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.totalIncome}</h3>
        <p className="text-lg sm:text-3xl font-bold text-green-600 dark:text-green-400 break-all">
          {formatCurrency(income, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">{l.projection}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border-l-4 border-red-500">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.totalExpenses}</h3>
        <p className="text-lg sm:text-3xl font-bold text-red-600 dark:text-red-400 break-all">
          {formatCurrency(expenses, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">{l.projection}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border-l-4 border-purple-500">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.totalSavings}</h3>
        <p className="text-lg sm:text-3xl font-bold text-purple-600 dark:text-purple-400 break-all">
          {formatCurrency(savings, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">{l.projection}</p>
      </div>

      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border-l-4 ${
        balance >= 0 ? 'border-blue-500' : 'border-orange-500'
      }`}>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{l.balance}</h3>
        <p className={`text-lg sm:text-3xl font-bold break-all ${
          balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
        }`}>
          {formatCurrency(balance, currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">
          {balance >= 0 ? l.surplus : l.deficit}
        </p>
      </div>
    </div>
  )
}
