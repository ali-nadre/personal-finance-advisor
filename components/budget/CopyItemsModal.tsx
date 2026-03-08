'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBudgetItems, copyBudgetItems } from '@/app/actions/budgets'
import { formatCurrency } from '@/lib/currency'
import type { BudgetItemWithCategory, Currency } from '@/types/database'

interface Props {
  householdId: string
  selectedYear: number
  currentYear: number
  currency: Currency
  onClose: () => void
}

export default function CopyItemsModal({ householdId, selectedYear, currentYear, currency, onClose }: Props) {
  const router = useRouter()
  const [sourceYear, setSourceYear] = useState(selectedYear - 1)
  const [targetYear, setTargetYear] = useState(selectedYear)
  const [items, setItems] = useState<BudgetItemWithCategory[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingItems, setLoadingItems] = useState(false)
  const [copying, setCopying] = useState(false)
  const [result, setResult] = useState<{ copied: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const yearRange = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  // Load items when source year changes
  useEffect(() => {
    setLoadingItems(true)
    setSelectedIds(new Set())
    setResult(null)
    getBudgetItems(householdId, sourceYear).then(({ data }) => {
      setItems(data ?? [])
      setLoadingItems(false)
    })
  }, [householdId, sourceYear])

  const allSelected = items.length > 0 && selectedIds.size === items.length
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopy = async () => {
    if (selectedIds.size === 0) {
      setError('Select at least one item to copy')
      return
    }
    if (sourceYear === targetYear) {
      setError('Source and target year must be different')
      return
    }

    setCopying(true)
    setError('')
    const { copied, skipped, error: copyError } = await copyBudgetItems(householdId, Array.from(selectedIds), targetYear)
    setCopying(false)

    if (copyError) {
      setError(copyError)
      return
    }

    setResult({ copied, skipped })
    router.refresh()
  }

  const annualAmount = (item: BudgetItemWithCategory) => {
    if (item.frequency === 'monthly') return item.amount * 12
    if (item.frequency === 'quarterly') return item.amount * 4
    return item.amount
  }

  const typeColor: Record<string, string> = {
    income: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expense: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    savings: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Copy Cash Flow Items</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Select items to copy into another year</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Year pickers */}
        <div className="flex gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Copy FROM</label>
            <select
              value={sourceYear}
              onChange={(e) => setSourceYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {yearRange.map((y) => (
                <option key={y} value={y}>{y}{y === currentYear ? ' (current)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Copy TO</label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {yearRange.map((y) => (
                <option key={y} value={y}>{y}{y === currentYear ? ' (current)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loadingItems ? (
            <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">Loading items…</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">No budget items in {sourceYear}</div>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Select all ({items.length} items)
                </label>
              </div>

              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg px-1 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.category.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typeColor[item.category.type]}`}>
                        {item.category.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(annualAmount(item), currency)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">{item.frequency}</div>
                  </div>
                </label>
              ))}
            </>
          )}
        </div>

        {/* Result message */}
        {result && (
          <div className="mx-6 mb-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
            ✓ Copied {result.copied} item{result.copied !== 1 ? 's' : ''} to {targetYear}
            {result.skipped > 0 && ` · ${result.skipped} skipped (already exist)`}
          </div>
        )}
        {error && (
          <p className="mx-6 mb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleCopy}
              disabled={copying || selectedIds.size === 0 || loadingItems}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {copying ? 'Copying…' : `Copy ${selectedIds.size > 0 ? selectedIds.size : ''} item${selectedIds.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
