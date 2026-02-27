import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHouseholdById } from '@/app/actions/households'
import { getGoals } from '@/app/actions/goals'
import CreateGoalButton from '@/components/goals/CreateGoalButton'
import GoalCard from '@/components/goals/GoalCard'

export default async function GoalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: household, error } = await getHouseholdById(id)
  if (error || !household) redirect('/dashboard')

  const { data: goals } = await getGoals(id)

  const activeGoals = goals?.filter((g) => !g.is_completed) ?? []
  const completedGoals = goals?.filter((g) => g.is_completed) ?? []

  const totalTargeted = goals?.reduce((s, g) => s + g.target_amount, 0) ?? 0
  const totalSaved = goals?.reduce((s, g) => s + g.current_amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500 mt-1">Track savings targets and deadlines.</p>
        </div>
        <CreateGoalButton householdId={id} />
      </div>

      {/* Summary bar */}
      {goals && goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Active Goals</p>
            <p className="text-2xl font-bold text-gray-900">{activeGoals.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-green-700">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: household.currency, maximumFractionDigits: 0 }).format(totalSaved)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-700">{completedGoals.length}</p>
          </div>
        </div>
      )}

      {/* No goals state */}
      {(!goals || goals.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">No goals yet</h3>
          <p className="text-blue-700 mb-5 max-w-sm mx-auto">
            Set a savings target, emergency fund, or any financial milestone and track it here.
          </p>
          <CreateGoalButton householdId={id} />
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} currency={household.currency} />
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} currency={household.currency} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
