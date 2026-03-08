import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { getUserHouseholds, processInvites } from '@/app/actions/households'
import NavLinks from '@/components/dashboard/NavLinks'
import NavControls from '@/components/dashboard/NavControls'
import BottomNav from '@/components/dashboard/BottomNav'
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

  // Convert any pending email invites into memberships on every login
  await processInvites()

  const { data: households } = await getUserHouseholds()
  const primaryHousehold = households?.[0] ?? null

  if (!primaryHousehold) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center gap-4">
            <Link href="/dashboard" className="flex-shrink-0">
              <div className="flex flex-col leading-tight">
                <span className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  FinanceOS
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate max-w-[120px] md:max-w-[140px]">
                  {primaryHousehold.name}
                </span>
              </div>
            </Link>

            {/* Desktop nav links — hidden on mobile */}
            <div className="hidden md:flex flex-1 justify-center">
              <NavLinks householdId={primaryHousehold.id} />
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <NavControls />
              <Link
                href={`/dashboard/households/${primaryHousehold.id}`}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                title="Household settings & members"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block truncate max-w-[160px]">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-2 md:px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <BottomNav householdId={primaryHousehold.id} />
    </div>
  )
}
