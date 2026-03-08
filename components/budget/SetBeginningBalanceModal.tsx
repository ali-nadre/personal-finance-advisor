'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertYearBalance } from '@/app/actions/budgets'
import type { Currency } from '@/types/database'

interface Props {
  householdId: string
  year: number
  currentBalance: number
  currency: Currency
  onClose: () => void
}

export default function SetBeginningBalanceModal({ householdId, year, currentBalance, currency, onClose }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(currentBalance === 0 ? '' : String(currentBalance))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const parsed = parseFloat(value)
    if (value.trim() === '' || isNaN(parsed)) {
      setError('Please enter a valid number')
      return
    }

    setLoading(true)
    setError('')
    const { error: saveError } = await upsertYearBalance(householdId, year, parsed)
    setLoading(false)

    if (saveError) {
      setError(saveError)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Beginning Balance</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your account balance on Jan 1, {year}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Balance ({currency})
          </label>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="0.00"
            autoFocus
            className="w-full px-4 py-2.5 text-lg font-semibold border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Can be negative if you started the year in debt.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
