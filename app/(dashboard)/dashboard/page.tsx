import { createClient } from '@/lib/supabase/server'
import { getUserHouseholds } from '@/app/actions/households'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: households } = await getUserHouseholds()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {user?.user_metadata?.full_name || user?.email}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your household budgets and get personalized financial guidance.
        </p>
      </div>

      {households && households.length > 0 ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Households</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {households.map((household) => (
                <Link
                  key={household.id}
                  href={`/dashboard/households/${household.id}`}
                  className="p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md dark:hover:shadow-gray-900/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{household.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to manage
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 border-l-4 border-blue-500 dark:border-blue-400 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Households</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Create and manage household budgets with family members
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-4">
                {households.length} active
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Budget Items</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Track incomes and expenses with categories
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-4">Coming soon</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 border-l-4 border-purple-500 dark:border-purple-400 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Financial Advisor</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get personalized financial guidance
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-4">Coming soon</p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Create Your First Household
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-6">
            Start by creating a household budget. You can invite family members to collaborate.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Click the <strong>"Select Household"</strong> button in the navigation above to create one.
          </p>
        </div>
      )}
    </div>
  )
}
