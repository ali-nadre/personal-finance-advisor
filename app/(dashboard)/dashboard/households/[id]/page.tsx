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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 mb-3">
          Ready to start tracking your budget? View and manage your household's income and expenses.
        </p>
        <Link
          href={`/dashboard/households/${id}/budget`}
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Go to Budget →
        </Link>
      </div>

      <HouseholdSettings household={household} currentUserId={user.id} />
    </div>
  )
}
