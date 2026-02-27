import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { getUserHouseholds } from '@/app/actions/households'
import NavLinks from '@/components/dashboard/NavLinks'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: households } = await getUserHouseholds()
  const primaryHousehold = households?.[0] ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-6">
            <Link href="/dashboard" className="flex-shrink-0">
              <span className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">
                FinanceOS
              </span>
            </Link>

            {primaryHousehold && (
              <div className="flex-1 flex justify-center">
                <NavLinks householdId={primaryHousehold.id} />
              </div>
            )}

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[160px]">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
