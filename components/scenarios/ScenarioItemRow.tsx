'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateScenarioItem, deleteScenarioItem } from '@/app/actions/scenarios'
import { formatCurrency } from '@/lib/currency'
import type { ScenarioItem } from '@/types/database'
import type { Currency } from '@/types/database'

interface Props {
  item: ScenarioItem
  currency?: Currency
}

export default function ScenarioItemRow({ item, currency = 'USD' }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.monthly_amount))
  const [saving, setSaving] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) labelRef.current?.focus()
  }, [editing])

  async function handleSave() {
    const parsed = parseFloat(amount)
    if (!label.trim() || isNaN(parsed) || parsed <= 0) {
      handleCancel()
      return
    }
    setSaving(true)
    await updateScenarioItem(item.id, label.trim(), parsed)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setLabel(item.label)
    setAmount(String(item.monthly_amount))
    setEditing(false)
  }

  async function handleDelete() {
    await deleteScenarioItem(item.id)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2 border-b border-blue-100 last:border-0">
        <input
          ref={labelRef}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          className="w-28 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          min="0.01"
          step="0.01"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? '...' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="px-2 py-1 border border-gray-300 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 group">
      <span
        className="text-sm text-gray-800 cursor-pointer hover:text-blue-600 transition flex-1 min-w-0 truncate"
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {item.label}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-sm font-semibold cursor-pointer hover:text-blue-600 transition ${item.category_type === 'income' ? 'text-green-700' : 'text-gray-800'}`}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {formatCurrency(item.monthly_amount, currency)}/mo
        </span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:border-blue-300"
        >
          edit
        </button>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition text-lg leading-none"
          title="Remove"
        >
          ×
        </button>
      </div>
    </div>
  )
}
