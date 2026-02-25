'use client'

import { useState } from 'react'
import type { HealthScoreResult } from '@/lib/scoring/health-score'
import HealthScoreBreakdown from './HealthScoreBreakdown'

interface Props {
  result: HealthScoreResult
}

const gradeColors: Record<string, { ring: string; text: string; bg: string; badge: string }> = {
  A: { ring: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  B: { ring: 'stroke-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700' },
  C: { ring: 'stroke-yellow-500',  text: 'text-yellow-600',  bg: 'bg-yellow-50',  badge: 'bg-yellow-100 text-yellow-700' },
  D: { ring: 'stroke-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700' },
  F: { ring: 'stroke-red-500',     text: 'text-red-600',     bg: 'bg-red-50',     badge: 'bg-red-100 text-red-700' },
}

export default function HealthScoreCard({ result }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const colors = gradeColors[result.grade]

  // SVG circle progress ring
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (result.total / 100) * circumference

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${showBreakdown ? 'col-span-full' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Financial Health Score</h2>
          <p className="text-sm text-gray-500 mt-0.5">Based on your budget & transactions</p>
        </div>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors.badge}`}>
          {result.label}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Ring chart */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" className="-rotate-90">
            <circle
              cx="64" cy="64" r={radius}
              strokeWidth="10"
              fill="none"
              className="stroke-gray-100"
            />
            <circle
              cx="64" cy="64" r={radius}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${colors.ring} transition-all duration-700`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${colors.text}`}>{result.total}</span>
            <span className="text-xs text-gray-400 font-medium">/ 100</span>
          </div>
        </div>

        {/* Mini pillar summary */}
        <div className="flex-1 space-y-2">
          {[
            { label: 'Savings Rate', score: result.savingsRate.score, value: result.savingsRate.value },
            { label: 'Budget Adherence', score: result.budgetAdherence.score, value: result.budgetAdherence.value },
            { label: 'Expense Balance', score: result.expenseDiversity.score, value: result.expenseDiversity.value },
            { label: 'Income Stability', score: result.incomeStability.score, value: result.incomeStability.value },
          ].map((pillar) => (
            <div key={pillar.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-32 flex-shrink-0">{pillar.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${colors.ring.replace('stroke-', 'bg-')}`}
                  style={{ width: `${(pillar.score / 25) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-10 text-right">{pillar.score}/25</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition"
      >
        {showBreakdown ? 'Hide breakdown' : 'View detailed breakdown & tips'}
      </button>

      {showBreakdown && <HealthScoreBreakdown result={result} />}
    </div>
  )
}
