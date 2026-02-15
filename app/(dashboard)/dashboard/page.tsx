import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.user_metadata?.full_name || user?.email}! 👋
        </h2>
        <p className="text-gray-600">
          Your household budget dashboard is ready. Phase 1 features coming soon:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-2">Households</h3>
          <p className="text-gray-600 text-sm">
            Create and manage household budgets with family members
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-4">Coming soon</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-2">Budget Items</h3>
          <p className="text-gray-600 text-sm">
            Track incomes and expenses with categories
          </p>
          <p className="text-2xl font-bold text-green-600 mt-4">Coming soon</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold mb-2">Financial Advisor</h3>
          <p className="text-gray-600 text-sm">
            Get personalized financial guidance
          </p>
          <p className="text-2xl font-bold text-purple-600 mt-4">Coming soon</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          🎉 Authentication is complete!
        </h3>
        <p className="text-blue-800 text-sm">
          You're logged in with {user?.app_metadata?.provider || 'email'}. Next up: household management and budget tracking.
        </p>
      </div>
    </div>
  )
}
