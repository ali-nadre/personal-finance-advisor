'use client'

import type { HealthScoreResult, HealthScorePillar } from '@/lib/scoring/health-score'

interface Props {
  result: HealthScoreResult
}

const pillarIcons: Record<string, string> = {
  'Savings Rate': '💰',
  'Budget Adherence': '📊',
  'Expense Diversity': '⚖️',
  'Income Stability': '📈',
}

function PillarCard({ pillar }: { pillar: HealthScorePillar }) {
  const pct = (pillar.score / pillar.maxScore) * 100
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-blue-500' :
    pct >= 40 ? 'bg-yellow-500' :
    pct >= 20 ? 'bg-orange-500' :
    'bg-red-500'

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{pillarIcons[pillar.label] || '📌'}</span>
          <span className="font-semibold text-gray-800 text-sm">{pillar.label}</span>
        </div>
        <span className="font-bold text-gray-900">{pillar.score}/{pillar.maxScore}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>

      <p className="text-xs text-gray-600">{pillar.message}</p>

      <div className="flex items-start gap-1.5 bg-white rounded p-2 border border-gray-200">
        <span className="text-blue-500 text-xs mt-0.5 flex-shrink-0">→</span>
        <p className="text-xs text-blue-700">{pillar.tip}</p>
      </div>
    </div>
  )
}

export default function HealthScoreBreakdown({ result }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PillarCard pillar={result.savingsRate} />
          <PillarCard pillar={result.budgetAdherence} />
          <PillarCard pillar={result.expenseDiversity} />
          <PillarCard pillar={result.incomeStability} />
        </div>
      </div>

      {/* Pro upgrade teaser */}
      <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">✨</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Pro: AI-powered recommendations</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Upgrade to get personalized coaching from Claude — your AI financial advisor that explains exactly what moves will improve your score the most.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
