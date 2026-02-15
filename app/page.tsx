import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
          Personal Finance Advisor
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Manage your household budget, track expenses, and get personalized
          financial guidance to reach your goals.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🏠</div>
            <h3 className="font-semibold text-lg mb-2">Household Budgets</h3>
            <p className="text-gray-600 text-sm">
              Collaborate with family members on shared budgets with customizable permissions
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Track Everything</h3>
            <p className="text-gray-600 text-sm">
              Organize incomes and expenses by category, monthly, quarterly, or yearly
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-semibold text-lg mb-2">Smart Advice</h3>
            <p className="text-gray-600 text-sm">
              Get personalized financial guidance based on your spending patterns
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
