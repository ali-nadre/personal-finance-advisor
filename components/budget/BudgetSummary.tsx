import type { BudgetSummary as BudgetSummaryType } from '@/app/actions/budgets'

export default function BudgetSummary({ summary }: { summary: BudgetSummaryType }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Income</h3>
        <p className="text-3xl font-bold text-green-600">
          {formatCurrency(summary.totalIncome)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Annual projection</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Expenses</h3>
        <p className="text-3xl font-bold text-red-600">
          {formatCurrency(summary.totalExpense)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Annual projection</p>
      </div>

      <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
        summary.balance >= 0 ? 'border-blue-500' : 'border-orange-500'
      }`}>
        <h3 className="text-sm font-semibold text-gray-600 mb-1">Balance</h3>
        <p className={`text-3xl font-bold ${
          summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
        }`}>
          {formatCurrency(summary.balance)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {summary.balance >= 0 ? 'Surplus' : 'Deficit'}
        </p>
      </div>
    </div>
  )
}
