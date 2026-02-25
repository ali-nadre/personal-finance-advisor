import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHouseholdById } from '@/app/actions/households'
import { getInsights, refreshInsights } from '@/app/actions/advisor'
import InsightsFeed from '@/components/advisor/InsightsFeed'
import AdvisorChat from '@/components/advisor/AdvisorChat'

export default async function AdvisorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: household, error } = await getHouseholdById(id)
  if (error || !household) redirect('/dashboard')

  // Refresh rule-based insights on every page load
  await refreshInsights(id)

  const { data: insights } = await getInsights(id)

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Advisor</h1>
          <p className="text-gray-500 mt-1">{household.name}</p>
        </div>
        {hasApiKey && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
            Pro — AI Powered
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights column */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Your Insights</h2>
            <p className="text-xs text-gray-400 mb-4">Updated automatically based on your budget & transactions</p>
            <InsightsFeed insights={insights ?? []} householdId={id} />
          </div>
        </div>

        {/* Chat column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '600px' }}>
          {hasApiKey ? (
            <AdvisorChat householdId={id} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-5xl mb-4">🤖</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Advisor (Pro)</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-xs">
                Chat with your personal AI financial advisor powered by Claude. Get personalized coaching based on your actual numbers.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left w-full max-w-xs">
                <p className="text-xs font-semibold text-gray-700 mb-1">To enable:</p>
                <p className="text-xs text-gray-500 font-mono">
                  ANTHROPIC_API_KEY=sk-ant-...
                </p>
                <p className="text-xs text-gray-400 mt-1">Add to your .env.local file</p>
              </div>
              <p className="text-xs text-gray-400 mt-4">Stripe billing coming in Phase 3</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
