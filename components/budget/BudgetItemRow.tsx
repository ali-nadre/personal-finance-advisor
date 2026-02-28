'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudgetItem, deleteBudgetItem } from '@/app/actions/budgets'
import { formatCurrency } from '@/lib/currency'
import { useLanguage } from '@/lib/i18n/context'
import type { BudgetItemWithCategory, Category, Currency, Frequency } from '@/types/database'

interface Props {
  item: BudgetItemWithCategory
  sameTypeCategories: Category[]
  currency: Currency
  viewMode: 'yearly' | 'monthly'
}

function toViewAmount(amount: number, frequency: string, viewMode: 'yearly' | 'monthly'): number {
  if (viewMode === 'yearly') {
    if (frequency === 'monthly') return amount * 12
    if (frequency === 'quarterly') return amount * 4
    return amount
  } else {
    if (frequency === 'monthly') return amount
    if (frequency === 'quarterly') return amount / 3
    return amount / 12
  }
}

export default function BudgetItemRow({ item, sameTypeCategories, currency, viewMode }: Props) {
  const router = useRouter()
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [categoryId, setCategoryId] = useState(item.category_id)
  const [amount, setAmount] = useState(String(item.amount))
  const [frequency, setFrequency] = useState<Frequency>(item.frequency)

  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) amountRef.current?.focus()
  }, [editing])

  function handleCancel() {
    setCategoryId(item.category_id)
    setAmount(String(item.amount))
    setFrequency(item.frequency)
    setEditing(false)
  }

  async function handleSave() {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      handleCancel()
      return
    }
    setSaving(true)
    await updateBudgetItem({
      id: item.id,
      category_id: categoryId,
      amount: parsed,
      frequency,
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this item?')) return
    setDeleting(true)
    await deleteBudgetItem(item.id)
    router.refresh()
  }

  const perLabel = viewMode === 'yearly' ? t('perYear') : t('perMonth')
  const displayAmount = toViewAmount(item.amount, item.frequency, viewMode)

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
        {/* Category select */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex-1 min-w-[140px] border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {sameTypeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Amount */}
        <input
          ref={amountRef}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          min="0.01"
          step="0.01"
          className="w-28 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Frequency */}
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          className="border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? '...' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span
            className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
            onClick={() => setEditing(true)}
            title="Click to edit"
          >
            {item.category.name}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
            {item.frequency}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="text-right cursor-pointer"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(displayAmount, currency)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{perLabel}</div>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition text-xs px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 hover:border-blue-300"
        >
          edit
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition text-lg leading-none disabled:opacity-50"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  )
}
