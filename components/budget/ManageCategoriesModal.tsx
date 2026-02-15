'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories, createCategory, deleteCategory } from '@/app/actions/budgets'
import type { Category, CategoryType } from '@/types/database'

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

    const { data, error: createError } = await createCategory({
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

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete category "${categoryName}"? This will also delete all budget items in this category.`)) {
      return
    }

    const { error: deleteError } = await deleteCategory(categoryId)

    if (deleteError) {
      setError(deleteError)
    } else {
      loadCategories()
      router.refresh()
    }
  }

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Category Form */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Create New Category</h3>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {creating ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading categories...</div>
        ) : (
          <div className="space-y-6">
            {/* Income Categories */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-green-200">
                Income Categories ({incomeCategories.length})
              </h3>
              {incomeCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">No income categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-300 transition"
                    >
                      <span className="font-medium text-gray-900">{cat.name}</span>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Categories */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-red-200">
                Expense Categories ({expenseCategories.length})
              </h3>
              {expenseCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">No expense categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-red-300 transition"
                    >
                      <span className="font-medium text-gray-900">{cat.name}</span>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
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

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
