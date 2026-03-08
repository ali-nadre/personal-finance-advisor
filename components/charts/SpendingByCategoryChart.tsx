'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/types/database'

interface CategoryData {
  categoryId: string
  categoryName: string
  total: number
  categoryType: 'income' | 'expense' | 'savings'
}

interface Props {
  data: CategoryData[]
  currency?: Currency
  type?: 'income' | 'expense' | 'savings'
  viewMode?: 'yearly' | 'monthly'
}

const EXPENSE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

const INCOME_COLORS = [
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#84cc16',
]

export default function SpendingByCategoryChart({ data, currency = 'USD', type = 'expense', viewMode = 'yearly' }: Props) {
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

  const toDisplay = (yearlyTotal: number) =>
    viewMode === 'monthly' ? yearlyTotal / 12 : yearlyTotal
  const perLabel = viewMode === 'monthly' ? '/mo' : '/yr'

  const chartData = filtered.map((d) => ({
    name: d.categoryName,
    value: toDisplay(d.total),
    categoryId: d.categoryId,
  }))

  const total = chartData.reduce((s, d) => s + d.value, 0)

  const scrollToCategory = (categoryId: string) => {
    document.getElementById(`budget-category-${categoryId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { categoryId: string } }> }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-3 text-sm">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
        <p className="text-gray-600 dark:text-gray-400">{formatCurrency(item.value, currency)}{perLabel}</p>
        <p className="text-gray-400 dark:text-gray-500">{Math.round((item.value / total) * 100)}% of total</p>
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Click to view details ↓</p>
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
            onClick={(entry) => scrollToCategory(entry.categoryId)}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="transparent"
                className="hover:opacity-80 transition-opacity"
                onClick={() => scrollToCategory(entry.categoryId)}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Category legend — hidden on mobile */}
      <div className="hidden sm:block mt-2 space-y-1">
        {filtered.map((d, i) => (
          <button
            key={d.categoryId}
            onClick={() => scrollToCategory(d.categoryId)}
            className="w-full flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 py-0.5 transition group"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px] group-hover:text-gray-900 dark:group-hover:text-gray-100 transition">
                {d.categoryName}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-gray-400">{Math.round((toDisplay(d.total) / total) * 100)}%</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(toDisplay(d.total), currency)}{perLabel}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
