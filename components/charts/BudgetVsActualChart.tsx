'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import type { BudgetVsActual, Currency } from '@/types/database'

interface Props {
  data: BudgetVsActual[]
  currency?: Currency
}

export default function BudgetVsActualChart({ data, currency = 'USD' }: Props) {
  const expenses = data
    .filter((d) => d.categoryType === 'expense' && (d.budgeted > 0 || d.actual > 0))
    .sort((a, b) => b.budgeted - a.budgeted)
    .slice(0, 8) // show top 8 categories

  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No budget vs actual data yet. Log some transactions!
      </div>
    )
  }

  const chartData = expenses.map((d) => ({
    name: d.categoryName.length > 10 ? d.categoryName.slice(0, 10) + '…' : d.categoryName,
    fullName: d.categoryName,
    Budgeted: d.budgeted,
    Actual: d.actual,
    over: d.actual > d.budgeted && d.budgeted > 0,
  }))

  const CustomTooltip = ({
    active, payload, label,
  }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    const item = chartData.find((d) => d.name === label)
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{item?.fullName ?? label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-medium">{formatCurrency(p.value, currency)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} barGap={2} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, '')}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
        />
        <Bar dataKey="Budgeted" fill="#93c5fd" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Actual" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.over ? '#ef4444' : '#22c55e'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
