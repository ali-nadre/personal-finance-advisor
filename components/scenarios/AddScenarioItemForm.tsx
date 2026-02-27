'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addScenarioItem } from '@/app/actions/scenarios'
import type { CategoryType } from '@/types/database'

interface Props {
  scenarioId: string
  defaultType?: CategoryType
  onAdded?: () => void
}

export default function AddScenarioItemForm({ scenarioId, defaultType = 'expense', onAdded }: Props) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<CategoryType>(defaultType)
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    const parsed = parseFloat(amount)
    if (!label.trim() || isNaN(parsed) || parsed <= 0) return

    setLoading(true)
    await addScenarioItem({
      scenario_id: scenarioId,
      label: label.trim(),
      category_type: type,
      monthly_amount: parsed,
    })
    setLabel('')
    setAmount('')
    setLoading(false)
    router.refresh()
    onAdded?.()
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as CategoryType)}
        className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (e.g. Salary, Rent)"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monthly $"
        className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        min="0"
        step="0.01"
      />
      <button
        onClick={handleAdd}
        disabled={!label.trim() || !amount || loading}
        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? '...' : 'Add'}
      </button>
    </div>
  )
}
