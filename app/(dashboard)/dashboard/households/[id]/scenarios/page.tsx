import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getHouseholdById } from '@/app/actions/households'
import { getScenarios } from '@/app/actions/scenarios'
import { getBudgetSummary } from '@/app/actions/budgets'
import CreateScenarioButton from '@/components/scenarios/CreateScenarioButton'
import { formatCurrency } from '@/lib/currency'

export default async function ScenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: household, error } = await getHouseholdById(id)
  if (error || !household) redirect('/dashboard')

  const [{ data: scenarios }, { data: budgetSummary }] = await Promise.all([
    getScenarios(id),
    getBudgetSummary(id, new Date().getFullYear()),
  ])

  const hasBudget = (budgetSummary?.byCategory.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-gray-500 mt-1">
            Model "what if" changes and see their impact over time.
          </p>
        </div>
        <CreateScenarioButton householdId={id} hasBudget={hasBudget} />
      </div>

      {!scenarios || scenarios.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🔭</div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">No scenarios yet</h3>
          <p className="text-blue-700 mb-5 max-w-sm mx-auto">
            Create a scenario to model a salary change, big purchase, or lifestyle shift — and see exactly how it affects your finances.
          </p>
          <CreateScenarioButton householdId={id} hasBudget={hasBudget} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/dashboard/households/${id}/scenarios/${scenario.id}`}
              className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold flex-shrink-0">
                  {scenario.name[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(scenario.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mt-3 group-hover:text-blue-700 transition">
                {scenario.name}
              </h3>
              {scenario.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
              )}
              <div className="mt-3 text-xs text-blue-600 font-medium">
                Open &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* How-it-works explainer */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-blue-900 mb-3">How scenarios work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-0.5">Pick a "what if"</p>
              <p className="text-sm text-blue-700">New job, moving city, having a baby, paying off debt — any life change that affects your money.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-0.5">Adjust income & expenses</p>
              <p className="text-sm text-blue-700">Add or tweak monthly income and expense lines. Start from scratch or clone your current budget as a baseline.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-0.5">See the long-term impact</p>
              <p className="text-sm text-blue-700">Drag the timeline slider from 1 to 20 years. See cumulative savings vs your current budget side by side.</p>
            </div>
          </div>
        </div>
        {!hasBudget && (
          <p className="text-xs text-blue-600 mt-3 border-t border-blue-200 pt-3">
            Tip: set up your Cash Flow first — then you can clone it as a starting point for any scenario.
          </p>
        )}
      </div>
    </div>
  )
}
