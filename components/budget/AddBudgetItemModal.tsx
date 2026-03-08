'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBudgetItem } from '@/app/actions/budgets'
import { CURRENCIES, convertCurrency, formatCurrency } from '@/lib/currency'
import type { Category, Currency, Frequency } from '@/types/database'

interface Props {
  householdId: string
  categories: Category[]
  currency: Currency
  onClose: () => void
}

export default function AddBudgetItemModal({ householdId, categories, currency, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    inputCurrency: currency,
    frequency: 'monthly' as Frequency,
    year: currentYear,
    description: '',
  })

  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)

  // Live conversion preview when currency or amount changes
  useEffect(() => {
    const parsed = parseFloat(formData.amount)
    if (!parsed || formData.inputCurrency === currency) {
      setConvertedAmount(null)
      return
    }
    let cancelled = false
    setConverting(true)
    convertCurrency(parsed, formData.inputCurrency, currency).then((result) => {
      if (!cancelled) {
        setConvertedAmount(result)
        setConverting(false)
      }
    })
    return () => { cancelled = true }
  }, [formData.amount, formData.inputCurrency, currency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = parseFloat(formData.amount)
    if (!formData.category_id || !parsed || parsed <= 0) {
      setError('Please fill in all required fields')
      return
    }

    let finalAmount = parsed
    if (formData.inputCurrency !== currency) {
      setLoading(true)
      const converted = await convertCurrency(parsed, formData.inputCurrency, currency)
      if (converted === null) {
        setError('Could not fetch exchange rate. Please try again or use the household currency.')
        setLoading(false)
        return
      }
      finalAmount = converted
    }

    setLoading(true)
    const { error: createError } = await createBudgetItem({
      household_id: householdId,
      category_id: formData.category_id,
      amount: Math.round(finalAmount * 100) / 100,
      frequency: formData.frequency,
      year: formData.year,
      description: formData.description || undefined,
    })

    setLoading(false)

    if (createError) {
      setError(createError)
    } else {
      router.refresh()
      onClose()
    }
  }

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const savingsCategories = categories.filter((c) => c.type === 'savings')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Budget Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            >
              <option value="">Select a category...</option>
              {incomeCategories.length > 0 && (
                <optgroup label="Income">
                  {incomeCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </optgroup>
              )}
              {expenseCategories.length > 0 && (
                <optgroup label="Expenses">
                  {expenseCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </optgroup>
              )}
              {savingsCategories.length > 0 && (
                <optgroup label="Savings">
                  {savingsCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          {/* Amount + currency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount *
            </label>
            <div className="flex gap-2">
              <select
                value={formData.inputCurrency}
                onChange={(e) => setFormData({ ...formData, inputCurrency: e.target.value as Currency })}
                className="w-28 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="0"
                required
              />
            </div>
            {/* Conversion preview */}
            {formData.inputCurrency !== currency && formData.amount && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                {converting
                  ? 'Converting...'
                  : convertedAmount !== null
                  ? `≈ ${formatCurrency(convertedAmount, currency)} (saved in ${currency})`
                  : 'Could not fetch rate'}
              </p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Year *
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows={2}
              placeholder="Add notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
