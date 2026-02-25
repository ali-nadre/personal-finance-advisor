import InsightCard from './InsightCard'

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
  insights: Insight[]
  householdId: string
  compact?: boolean
}

export default function InsightsFeed({ insights, householdId, compact = false }: Props) {
  const unreadCount = insights.filter((i) => !i.is_read).length
  const displayInsights = compact ? insights.slice(0, 3) : insights

  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-sm">No insights right now. Check back after logging more transactions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && !compact && (
        <p className="text-xs text-gray-500">{unreadCount} new insight{unreadCount !== 1 ? 's' : ''}</p>
      )}
      {displayInsights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
      {compact && insights.length > 3 && (
        <p className="text-xs text-center text-gray-400">
          +{insights.length - 3} more insights on the Advisor page
        </p>
      )}
    </div>
  )
}
