'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markInsightRead, dismissInsight } from '@/app/actions/advisor'

interface Insight {
  id: string
  type: 'tip' | 'warning' | 'opportunity' | 'milestone'
  title: string
  body: string
  source: 'rule_engine' | 'ai'
  is_read: boolean
  created_at: string
}

interface Props {
  insight: Insight
}

const typeConfig = {
  warning:     { icon: '⚠️', bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    label: 'Warning' },
  tip:         { icon: '💡', bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   label: 'Tip' },
  opportunity: { icon: '✨', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', label: 'Opportunity' },
  milestone:   { icon: '🏆', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: 'Milestone' },
}

export default function InsightCard({ insight }: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const config = typeConfig[insight.type]

  const handleExpand = async () => {
    if (!insight.is_read) {
      await markInsightRead(insight.id)
      router.refresh()
    }
  }

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    await dismissInsight(insight.id)
    router.refresh()
  }

  if (dismissed) return null

  return (
    <div
      className={`rounded-lg border p-4 ${config.bg} ${config.border} cursor-pointer hover:shadow-sm transition`}
      onClick={handleExpand}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                {config.label}
              </span>
              {!insight.is_read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
              {insight.source === 'ai' && (
                <span className="text-xs text-purple-600 font-medium">AI</span>
              )}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{insight.body}</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
