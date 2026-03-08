'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudgetItem, deleteBudgetItem } from '@/app/actions/budgets'
import { CURRENCIES, convertCurrency, formatCurrency } from '@/lib/currency'
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
  const [inputCurrency, setInputCurrency] = useState<Currency>(currency)
  const [frequency, setFrequency] = useState<Frequency>(item.frequency)
  const [description, setDescription] = useState(item.description ?? '')
  const [year, setYear] = useState(item.year)

  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)

  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) amountRef.current?.focus()
  }, [editing])

  // Live conversion preview
  useEffect(() => {
    if (!editing) return
    const parsed = parseFloat(amount)
    if (!parsed || inputCurrency === currency) { setConvertedAmount(null); return }
    let cancelled = false
    setConverting(true)
    convertCurrency(parsed, inputCurrency, currency).then((result) => {
      if (!cancelled) { setConvertedAmount(result); setConverting(false) }
    })
    return () => { cancelled = true }
  }, [amount, inputCurrency, currency, editing])

  function handleCancel() {
    setCategoryId(item.category_id)
    setAmount(String(item.amount))
    setInputCurrency(currency)
    setFrequency(item.frequency)
    setDescription(item.description ?? '')
    setYear(item.year)
    setConvertedAmount(null)
    setEditing(false)
  }

  async function handleSave() {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) { handleCancel(); return }

    let finalAmount = parsed
    if (inputCurrency !== currency) {
      setSaving(true)
      const converted = await convertCurrency(parsed, inputCurrency, currency)
      if (converted === null) { setSaving(false); return }
      finalAmount = Math.round(converted * 100) / 100
    }

    setSaving(true)
    await updateBudgetItem({ id: item.id, category_id: categoryId, amount: finalAmount, frequency, year, description: description || undefined })
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
    const fieldCls = "w-full border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
    return (
      <div className="flex flex-col gap-3 p-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
        {/* Category — full width */}
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldCls}>
          {sameTypeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Currency + Amount side by side */}
        <div className="flex gap-2">
          <select
            value={inputCurrency}
            onChange={(e) => setInputCurrency(e.target.value as Currency)}
            className="w-28 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none flex-shrink-0"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <input
            ref={amountRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
            min="0.01"
            step="0.01"
            className="flex-1 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Conversion preview */}
        {inputCurrency !== currency && amount && (
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            {converting
              ? 'Converting...'
              : convertedAmount !== null
              ? `≈ ${formatCurrency(convertedAmount, currency)} (saved in ${currency})`
              : 'Could not fetch rate — save will be skipped'}
          </p>
        )}

        {/* Frequency + Year side by side */}
        <div className="flex gap-2">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className="flex-1 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2000"
            max="2100"
            className="w-24 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none flex-shrink-0"
          />
        </div>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className={fieldCls}
        />

        {/* Save / Cancel — full width */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition group gap-2">
      {/* Left: name + meta */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)}>
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition leading-snug">
          {item.category.name}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded">
            {item.frequency}
          </span>
          {item.year && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{item.year}</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{item.description}</p>
        )}
      </div>

      {/* Right: amount + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right cursor-pointer" onClick={() => setEditing(true)}>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {formatCurrency(displayAmount, currency)}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{perLabel}</div>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition text-xs px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 hover:border-blue-300 whitespace-nowrap"
        >
          edit
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition text-lg leading-none disabled:opacity-50 flex-shrink-0"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  )
}
