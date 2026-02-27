'use client'

import { useState } from 'react'
import { runProjection } from '@/lib/scenarios/projection-engine'
import ScenarioProjectionChart from './ScenarioProjectionChart'
import { formatCurrency } from '@/lib/currency'
import type { ScenarioItem } from '@/types/database'
import type { Currency } from '@/types/database'

interface BudgetItem {
  category_type: 'income' | 'expense'
  monthly_amount: number
}

interface Props {
  items: ScenarioItem[]
  currency?: Currency
  budgetItems?: BudgetItem[]
  savingsRate: number
}

export default function ScenarioProjectionSection({
  items,
  currency = 'USD',
  budgetItems,
  savingsRate,
}: Props) {
  const [years, setYears] = useState(5)
  const months = years * 12

  const projection = runProjection(items, months)
  const budgetProjection =
    budgetItems && budgetItems.length > 0
      ? runProjection(budgetItems, months)
      : undefined

  const finalScenario = projection[projection.length - 1]?.cumulativeSavings ?? 0
  const finalBudget = budgetProjection?.[budgetProjection.length - 1]?.cumulativeSavings
  const difference = finalBudget !== undefined ? finalScenario - finalBudget : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Savings Projection</h3>
        {savingsRate !== 0 && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              savingsRate >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {savingsRate}% savings rate
          </span>
        )}
      </div>

      {/* Year slider */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs text-gray-400 whitespace-nowrap">1 yr</span>
        <input
          type="range"
          min={1}
          max={20}
          value={years}
          onChange={(e) => setYears(parseInt(e.target.value))}
          className="flex-1 h-2 accent-blue-600 cursor-pointer"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">20 yr</span>
        <span className="text-sm font-bold text-blue-700 w-20 text-right">
          {years} {years === 1 ? 'year' : 'years'}
        </span>
      </div>

      {/* Outcome summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">In {years} {years === 1 ? 'year' : 'years'} (this scenario)</p>
          <p className={`text-lg font-bold ${finalScenario >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {formatCurrency(finalScenario, currency)}
          </p>
        </div>
        {difference !== null && (
          <div className={`rounded-xl p-3 ${difference >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-500 mb-0.5">vs current budget</p>
            <p className={`text-lg font-bold ${difference >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {difference >= 0 ? '+' : ''}{formatCurrency(difference, currency)}
            </p>
          </div>
        )}
      </div>

      {budgetProjection && (
        <p className="text-xs text-gray-400 mb-3">
          Blue = this scenario · Gray = your current budget
        </p>
      )}

      <ScenarioProjectionChart
        data={projection}
        currency={currency}
        compareData={budgetProjection}
      />
    </div>
  )
}
