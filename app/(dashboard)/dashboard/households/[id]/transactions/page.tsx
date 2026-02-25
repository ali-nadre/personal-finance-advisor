import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHouseholdById } from '@/app/actions/households'
import { getTransactions, getMonthlyTransactionSummary } from '@/app/actions/transactions'
import { getCategories } from '@/app/actions/budgets'
import { formatCurrency } from '@/lib/currency'
import TransactionList from '@/components/transactions/TransactionList'
import AddTransactionButton from '@/components/transactions/AddTransactionButton'

export default async function TransactionsPage({ params }: { params: Promise<{ id: string }> }) {
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
    { data: transactions },
    { data: categories },
    { data: monthlySummary },
  ] = await Promise.all([
    getTransactions(id, {
      date_from: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      date_to: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
    }),
    getCategories(id),
    getMonthlyTransactionSummary(id, currentYear, currentMonth),
  ])

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Transactions - {household.name}
          </h1>
          <p className="text-gray-600 mt-1">{monthName}</p>
        </div>
        <AddTransactionButton householdId={id} categories={categories || []} />
      </div>

      {/* Monthly Summary Cards */}
      {monthlySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Income</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlySummary.totalIncome, household.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlySummary.totalExpense, household.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Net</p>
            <p className={`text-2xl font-bold ${monthlySummary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthlySummary.net, household.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">
              {monthlySummary.transactionCount}
            </p>
          </div>
        </div>
      )}

      <TransactionList
        transactions={transactions || []}
        categories={categories || []}
        householdId={id}
        currency={household.currency}
      />
    </div>
  )
}
