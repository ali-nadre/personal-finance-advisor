import { createClient } from '@/lib/supabase/server'
import { getUserHouseholds } from '@/app/actions/households'
import { getHealthScore } from '@/app/actions/healthScore'
import { getMonthlyTransactionSummary } from '@/app/actions/transactions'
import { getInsights, refreshInsights } from '@/app/actions/advisor'
import { formatCurrency } from '@/lib/currency'
import HealthScoreCard from '@/components/dashboard/HealthScoreCard'
import InsightsFeed from '@/components/advisor/InsightsFeed'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: households } = await getUserHouseholds()

  // Load health score + monthly summary + insights for the first household
  const primaryHousehold = households?.[0] ?? null
  const now = new Date()

  // Refresh insights in background before fetching
  if (primaryHousehold) {
    await refreshInsights(primaryHousehold.id)
  }

  const [healthScoreResult, monthlySummaryResult, insightsResult] = primaryHousehold
    ? await Promise.all([
        getHealthScore(primaryHousehold.id),
        getMonthlyTransactionSummary(
          primaryHousehold.id,
          now.getFullYear(),
          now.getMonth() + 1
        ),
        getInsights(primaryHousehold.id),
      ])
    : [{ data: null }, { data: null }, { data: null }]

  const healthScore = healthScoreResult.data
  const monthlySummary = monthlySummaryResult.data
  const insights = insightsResult.data ?? []
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
        </h2>
        <p className="text-gray-500 text-sm">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {households && households.length > 0 ? (
        <>
          {/* Health Score + Monthly Summary row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score — takes 2 cols */}
            <div className="lg:col-span-2">
              {healthScore ? (
                <HealthScoreCard result={healthScore} />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Financial Health Score</h2>
                  <p className="text-gray-500 text-sm">
                    Add income and expenses to your Cash Flow to see your score.
                  </p>
                  {primaryHousehold && (
                    <Link
                      href={`/dashboard/households/${primaryHousehold.id}/budget`}
                      className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Set up Cash Flow
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* This month summary */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{monthName} Summary</p>
                {monthlySummary && (monthlySummary.totalIncome > 0 || monthlySummary.totalExpense > 0) ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Income</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(monthlySummary.totalIncome, primaryHousehold?.currency ?? 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expenses</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(monthlySummary.totalExpense, primaryHousehold?.currency ?? 'USD')}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-800">Net</span>
                      <span className={`font-bold text-lg ${monthlySummary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {monthlySummary.net >= 0 ? '+' : ''}{formatCurrency(monthlySummary.net, primaryHousehold?.currency ?? 'USD')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {monthlySummary.transactionCount} transaction{monthlySummary.transactionCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">No transactions yet this month.</p>
                    {primaryHousehold && (
                      <Link
                        href={`/dashboard/households/${primaryHousehold.id}/transactions`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        + Log first transaction
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Quick links */}
              {primaryHousehold && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Links</p>
                  <Link
                    href={`/dashboard/households/${primaryHousehold.id}/budget`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition"
                  >
                    <span>📊</span> Cash Flow
                  </Link>
                  <Link
                    href={`/dashboard/households/${primaryHousehold.id}/transactions`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition"
                  >
                    <span>💳</span> Transactions
                  </Link>
                  <Link
                    href={`/dashboard/households/${primaryHousehold.id}/advisor`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition"
                  >
                    <span>🤖</span> Advisor
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Insights feed */}
          {insights.length > 0 && primaryHousehold && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Advisor Insights</h3>
                <Link
                  href={`/dashboard/households/${primaryHousehold.id}/advisor`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all →
                </Link>
              </div>
              <InsightsFeed insights={insights} householdId={primaryHousehold.id} compact />
            </div>
          )}

          {/* Households list (if multiple) */}
          {households.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Your Households</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {households.map((household) => (
                  <Link
                    key={household.id}
                    href={`/dashboard/households/${household.id}`}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                        🏠
                      </div>
                      <span className="font-medium text-gray-900">{household.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            Create Your First Household
          </h3>
          <p className="text-blue-700 mb-2">
            Start by creating a household budget. Invite family members to collaborate!
          </p>
          <p className="text-sm text-blue-600">
            Click <strong>"Select Household"</strong> in the navigation to get started.
          </p>
        </div>
      )}
    </div>
  )
}
