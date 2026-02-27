import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getHouseholdById } from '@/app/actions/households'
import { getBudgetItems, getCategories, getBudgetSummary } from '@/app/actions/budgets'
import { getBudgetVsActual } from '@/app/actions/transactions'
import BudgetSummary from '@/components/budget/BudgetSummary'
import BudgetItemList from '@/components/budget/BudgetItemList'
import BudgetVsActualView from '@/components/budget/BudgetVsActual'
import AddBudgetItemButton from '@/components/budget/AddBudgetItemButton'
import ManageCategoriesButton from '@/components/budget/ManageCategoriesButton'
import SpendingByCategoryChart from '@/components/charts/SpendingByCategoryChart'
import BudgetVsActualChart from '@/components/charts/BudgetVsActualChart'

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: household, error: householdError } = await getHouseholdById(id)

  if (householdError || !household) {
    redirect('/dashboard')
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [
    { data: budgetItems },
    { data: categories },
    { data: summary },
    { data: budgetVsActual },
  ] = await Promise.all([
    getBudgetItems(id, currentYear),
    getCategories(id),
    getBudgetSummary(id, currentYear),
    getBudgetVsActual(id, currentYear, currentMonth),
  ])

  const monthName = now.toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cash Flow
          </h1>
          <p className="text-gray-600 mt-1">{household.name} · {currentYear}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/households/${id}/transactions`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Transactions
          </Link>
          <ManageCategoriesButton householdId={id} />
          <AddBudgetItemButton householdId={id} categories={categories || []} />
        </div>
      </div>

      {summary && <BudgetSummary summary={summary} currency={household.currency} />}

      {/* Charts row */}
      {summary && summary.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category (annual)</h3>
            <SpendingByCategoryChart
              data={summary.byCategory}
              currency={household.currency}
              type="expense"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Budget vs Actual — {monthName}</h3>
            <p className="text-xs text-gray-400 mb-3">Blue = budgeted · Green = under · Red = over</p>
            <BudgetVsActualChart
              data={budgetVsActual ?? []}
              currency={household.currency}
            />
          </div>
        </div>
      )}

      {/* Budget vs Actual for current month (progress bars) */}
      {budgetVsActual && budgetVsActual.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">{monthName} {currentYear}</p>
          <BudgetVsActualView data={budgetVsActual} currency={household.currency} />
        </div>
      )}

      {categories && categories.length > 0 ? (
        <BudgetItemList
          items={budgetItems || []}
          categories={categories}
          householdId={id}
          currency={household.currency}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Create Categories First
          </h3>
          <p className="text-yellow-800 mb-4">
            Before adding budget items, you need to create some categories for income and expenses.
          </p>
          <ManageCategoriesButton householdId={id} />
        </div>
      )}
    </div>
  )
}
