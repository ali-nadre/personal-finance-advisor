import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHouseholdById } from '@/app/actions/households'
import { getBudgetItems, getCategories, getBudgetSummary } from '@/app/actions/budgets'
import AddBudgetItemButton from '@/components/budget/AddBudgetItemButton'
import ManageCategoriesButton from '@/components/budget/ManageCategoriesButton'
import CashFlowPageContent from '@/components/budget/CashFlowPageContent'

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

  const [
    { data: budgetItems },
    { data: categories },
    { data: summary },
  ] = await Promise.all([
    getBudgetItems(id, currentYear),
    getCategories(id),
    getBudgetSummary(id, currentYear),
  ])

  // No categories yet — show setup prompt
  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cash Flow</h1>
          <ManageCategoriesButton householdId={id} />
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Create Categories First
          </h3>
          <p className="text-yellow-800 dark:text-yellow-300 mb-4">
            Before adding budget items, you need to create some categories for income and expenses.
          </p>
          <ManageCategoriesButton householdId={id} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action buttons row */}
      <div className="flex justify-end gap-3">
        <ManageCategoriesButton householdId={id} />
        <AddBudgetItemButton householdId={id} categories={categories} />
      </div>

      {summary ? (
        <CashFlowPageContent
          summary={summary}
          budgetItems={budgetItems || []}
          categories={categories}
          currency={household.currency}
          householdId={id}
          currentYear={currentYear}
          householdName={household.name}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Add income and expense items to see your Cash Flow summary.
          </p>
        </div>
      )}
    </div>
  )
}
