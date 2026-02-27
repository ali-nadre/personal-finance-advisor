import { getHouseholdById } from '@/app/actions/households'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HouseholdSettings from '@/components/households/HouseholdSettings'

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: household, error } = await getHouseholdById(id)

  if (error || !household) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 mb-3">
            Plan your income and expenses with budgets.
          </p>
          <Link
            href={`/dashboard/households/${id}/budget`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go to Budget
          </Link>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 mb-3">
            Track actual spending and compare against your budget.
          </p>
          <Link
            href={`/dashboard/households/${id}/transactions`}
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Go to Transactions
          </Link>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-800 mb-3">
            Model "what if" changes and see their 2-year impact.
          </p>
          <Link
            href={`/dashboard/households/${id}/scenarios`}
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Scenarios
          </Link>
        </div>
      </div>

      <HouseholdSettings household={household} currentUserId={user.id} />
    </div>
  )
}
