'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import type { ProjectionMonth } from '@/types/database'
import type { Currency } from '@/types/database'

interface Props {
  data: ProjectionMonth[]
  currency?: Currency
  compareData?: ProjectionMonth[]
  compareLabel?: string
}

export default function ScenarioProjectionChart({
  data,
  currency = 'USD',
  compareData,
  compareLabel = 'Current Budget',
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Add income and expense items to see your projection.
      </div>
    )
  }

  const chartData = data.map((d, i) => ({
    label: d.label,
    scenario: d.cumulativeSavings,
    ...(compareData ? { compare: compareData[i]?.cumulativeSavings ?? 0 } : {}),
  }))

  const allValues = chartData.flatMap((d) => [d.scenario, d.compare ?? 0])
  const minVal = Math.min(...allValues, 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name === 'scenario' ? 'This scenario' : compareLabel}:{' '}
            <span className="font-semibold">{formatCurrency(p.value, currency)}</span>
          </p>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="scenarioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="compareGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, currency, true)}
          domain={[minVal < 0 ? minVal * 1.1 : 0, 'auto']}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        {minVal < 0 && <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />}
        {compareData && (
          <Area
            type="monotone"
            dataKey="compare"
            stroke="#9ca3af"
            strokeWidth={1.5}
            fill="url(#compareGrad)"
            name="compare"
            dot={false}
          />
        )}
        <Area
          type="monotone"
          dataKey="scenario"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#scenarioGrad)"
          name="scenario"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
