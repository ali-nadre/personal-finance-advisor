'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories, createCategory, deleteCategory } from '@/app/actions/budgets'
import type { Category, CategoryType } from '@/types/database'
import { PREDEFINED_INCOME, PREDEFINED_EXPENSES } from '@/lib/budget/predefinedCategories'

interface Props {
  householdId: string
  onClose: () => void
}

export default function ManageCategoriesModal({ householdId, onClose }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [addingPreset, setAddingPreset] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as CategoryType,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const { data, error: fetchError } = await getCategories(householdId)
    setLoading(false)
    if (fetchError) {
      setError(fetchError)
    } else {
      setCategories(data || [])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    if (!formData.name.trim()) {
      setError('Category name is required')
      setCreating(false)
      return
    }
    const { error: createError } = await createCategory({
      household_id: householdId,
      name: formData.name.trim(),
      type: formData.type,
    })
    setCreating(false)
    if (createError) {
      setError(createError)
    } else {
      setFormData({ name: '', type: 'expense' })
      loadCategories()
      router.refresh()
    }
  }

  const handleAddPreset = async (name: string, type: CategoryType) => {
    setAddingPreset(name)
    const { error: createError } = await createCategory({
      household_id: householdId,
      name,
      type,
    })
    if (!createError) {
      loadCategories()
      router.refresh()
    }
    setAddingPreset(null)
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete category "${categoryName}"? This will also delete all budget items in this category.`)) return
    const { error: deleteError } = await deleteCategory(categoryId)
    if (deleteError) {
      setError(deleteError)
    } else {
      loadCategories()
      router.refresh()
    }
  }

  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()))
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const unusedIncome = PREDEFINED_INCOME.filter((n) => !existingNames.has(n.toLowerCase()))
  const unusedExpenses = PREDEFINED_EXPENSES.filter((n) => !existingNames.has(n.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Custom category form */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Create Custom Category</h3>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {creating ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Predefined categories quick-add */}
        {(unusedIncome.length > 0 || unusedExpenses.length > 0) && (
          <div className="mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
              Quick Add
            </h3>

            {unusedIncome.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Income</p>
                <div className="flex flex-wrap gap-2">
                  {unusedIncome.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleAddPreset(name, 'income')}
                      disabled={addingPreset === name}
                      className="px-3 py-1 text-xs font-medium rounded-full border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition disabled:opacity-50"
                    >
                      {addingPreset === name ? '...' : `+ ${name}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {unusedExpenses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">Expenses</p>
                <div className="flex flex-wrap gap-2">
                  {unusedExpenses.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleAddPreset(name, 'expense')}
                      disabled={addingPreset === name}
                      className="px-3 py-1 text-xs font-medium rounded-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                    >
                      {addingPreset === name ? '...' : `+ ${name}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing categories */}
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading categories...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-green-200 dark:border-green-800">
                Income ({incomeCategories.length})
              </h3>
              {incomeCategories.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No income categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-700 transition"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</span>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-red-200 dark:border-red-800">
                Expenses ({expenseCategories.length})
              </h3>
              {expenseCategories.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No expense categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-700 transition"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</span>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
