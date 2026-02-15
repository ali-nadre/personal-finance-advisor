'use client'

import type { BudgetItemWithCategory, Category, Currency } from '@/types/database'
import { deleteBudgetItem } from '@/app/actions/budgets'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatCurrency } from '@/lib/currency'

interface Props {
  items: BudgetItemWithCategory[]
  categories: Category[]
  householdId: string
  currency?: Currency
}

export default function BudgetItemList({ items, categories, householdId, currency = 'USD' }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) {
      return
    }

    setDeletingId(itemId)
    const { error } = await deleteBudgetItem(itemId)

    if (error) {
      alert('Failed to delete budget item: ' + error)
    } else {
      router.refresh()
    }
    setDeletingId(null)
  }

  const incomeItems = items.filter((item) => item.category.type === 'income')
  const expenseItems = items.filter((item) => item.category.type === 'expense')

  const renderItems = (itemsList: BudgetItemWithCategory[], title: string, colorClass: string) => (
    <div className="bg-white rounded-lg shadow">
      <div className={`px-6 py-4 border-b border-gray-200 ${colorClass}`}>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="p-6">
        {itemsList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No {title.toLowerCase()} items yet.</p>
        ) : (
          <div className="space-y-3">
            {itemsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-900">
                      {item.category.name}
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {item.frequency}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.amount, currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      per {item.frequency === 'monthly' ? 'month' : item.frequency === 'quarterly' ? 'quarter' : 'year'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                  >
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {renderItems(incomeItems, 'Income', 'bg-green-50')}
      {renderItems(expenseItems, 'Expenses', 'bg-red-50')}
    </div>
  )
}
