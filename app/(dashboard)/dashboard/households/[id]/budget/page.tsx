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
            Budget - {household.name}
          </h1>
          <p className="text-gray-600 mt-1">Year: {currentYear}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/households/${id}/transactions`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            View Transactions
          </Link>
          <ManageCategoriesButton householdId={id} />
          <AddBudgetItemButton householdId={id} categories={categories || []} />
        </div>
      </div>

      {summary && <BudgetSummary summary={summary} currency={household.currency} />}

      {/* Budget vs Actual for current month */}
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
