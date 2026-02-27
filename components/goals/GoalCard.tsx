'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addContribution, archiveGoal, markGoalComplete } from '@/app/actions/goals'
import { formatCurrency } from '@/lib/currency'
import { GOAL_TYPE_CONFIG } from './GoalTypeConfig'
import type { FinancialGoal } from '@/types/database'
import type { Currency } from '@/types/database'

interface Props {
  goal: FinancialGoal
  currency?: Currency
}

function monthsUntil(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  return Math.max(
    0,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  )
}

export default function GoalCard({ goal, currency = 'USD' }: Props) {
  const router = useRouter()
  const [addingFunds, setAddingFunds] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [fundNote, setFundNote] = useState('')
  const [loading, setLoading] = useState(false)

  const config = GOAL_TYPE_CONFIG[goal.goal_type]
  const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
  const remaining = Math.max(0, goal.target_amount - goal.current_amount)
  const months = goal.deadline ? monthsUntil(goal.deadline) : null
  const monthlyNeeded = months && months > 0 ? remaining / months : null

  async function handleAddFunds() {
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) return
    setLoading(true)
    await addContribution({ goal_id: goal.id, amount, note: fundNote || undefined })
    setFundAmount('')
    setFundNote('')
    setAddingFunds(false)
    setLoading(false)
    router.refresh()
  }

  async function handleArchive() {
    await archiveGoal(goal.id)
    router.refresh()
  }

  async function handleComplete() {
    await markGoalComplete(goal.id)
    router.refresh()
  }

  return (
    <div className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 ${goal.is_completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${config.bg} ${config.color}`}>
            {config.label}
          </span>
          <h3 className="text-base font-semibold text-gray-900 leading-tight truncate">
            {goal.name}
          </h3>
        </div>
        {goal.is_completed && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
            Complete!
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-semibold text-gray-800">{formatCurrency(goal.current_amount, currency)}</span>
          <span className="text-gray-400">of {formatCurrency(goal.target_amount, currency)}</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${goal.is_completed ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>{percent}% complete</span>
          {remaining > 0 && <span>{formatCurrency(remaining, currency)} to go</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs">
        {goal.deadline && (
          <div className="flex-1 bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Deadline</p>
            <p className="font-semibold text-gray-700">
              {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {months !== null && months > 0 && (
                <span className="text-gray-400 font-normal ml-1">({months}mo left)</span>
              )}
            </p>
          </div>
        )}
        {monthlyNeeded && monthlyNeeded > 0 && (
          <div className="flex-1 bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Need/month</p>
            <p className="font-semibold text-gray-700">{formatCurrency(monthlyNeeded, currency)}</p>
          </div>
        )}
      </div>

      {/* Add funds section */}
      {!goal.is_completed && !addingFunds && (
        <div className="flex gap-2">
          <button
            onClick={() => setAddingFunds(true)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add Funds
          </button>
          {percent >= 100 && (
            <button
              onClick={handleComplete}
              className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Mark Complete
            </button>
          )}
          <button
            onClick={handleArchive}
            className="px-3 py-2 border border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition"
            title="Delete"
          >
            ×
          </button>
        </div>
      )}

      {addingFunds && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Amount"
              min="0.01"
              step="0.01"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddFunds()}
            />
            <button
              onClick={handleAddFunds}
              disabled={!fundAmount || loading}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? '...' : 'Add'}
            </button>
            <button
              onClick={() => { setAddingFunds(false); setFundAmount(''); setFundNote('') }}
              className="px-3 py-2 border border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            value={fundNote}
            onChange={(e) => setFundNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {goal.is_completed && (
        <button
          onClick={handleArchive}
          className="w-full px-3 py-2 border border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition"
        >
          Remove
        </button>
      )}
    </div>
  )
}
