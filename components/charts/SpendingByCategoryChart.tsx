'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/types/database'

interface CategoryData {
  categoryName: string
  total: number
  categoryType: 'income' | 'expense'
}

interface Props {
  data: CategoryData[]
  currency?: Currency
  type?: 'income' | 'expense'
}

const EXPENSE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

const INCOME_COLORS = [
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#84cc16',
]

export default function SpendingByCategoryChart({ data, currency = 'USD', type = 'expense' }: Props) {
  const filtered = data
    .filter((d) => d.categoryType === type && d.total > 0)
    .sort((a, b) => b.total - a.total)

  const colors = type === 'expense' ? EXPENSE_COLORS : INCOME_COLORS

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No {type} data to display.
      </div>
    )
  }

  const chartData = filtered.map((d) => ({
    name: d.categoryName,
    value: d.total,
  }))

  const total = filtered.reduce((s, d) => s + d.total, 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-gray-600">{formatCurrency(item.value, currency)}</p>
        <p className="text-gray-400">{Math.round((item.value / total) * 100)}% of total</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Top categories list below chart */}
      <div className="mt-2 space-y-1">
        {filtered.slice(0, 4).map((d, i) => (
          <div key={d.categoryName} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-gray-600 truncate max-w-[120px]">{d.categoryName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-gray-400">{Math.round((d.total / total) * 100)}%</span>
              <span className="font-medium text-gray-700">{formatCurrency(d.total / 12, currency)}/mo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
