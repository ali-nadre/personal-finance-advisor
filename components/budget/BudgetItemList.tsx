'use client'

import type { BudgetItemWithCategory, Category, Currency } from '@/types/database'
import { deleteBudgetItem } from '@/app/actions/budgets'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatCurrency } from '@/lib/currency'
import { useLanguage } from '@/lib/i18n/context'

interface Props {
  items: BudgetItemWithCategory[]
  categories: Category[]
  householdId: string
  currency?: Currency
  viewMode?: 'yearly' | 'monthly'
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

export default function BudgetItemList({ items, categories, householdId, currency = 'USD', viewMode = 'yearly' }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { t } = useLanguage()

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return
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
  const perLabel = viewMode === 'yearly' ? t('perYear') : t('perMonth')

  const renderItems = (itemsList: BudgetItemWithCategory[], title: string, colorClass: string, emptyMsg: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${colorClass}`}>
        <h2 className="text-xl font-semibold dark:text-gray-100">{title}</h2>
      </div>
      <div className="p-6">
        {itemsList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{emptyMsg}</p>
        ) : (
          <div className="space-y-3">
            {itemsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.category.name}
                    </div>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                      {item.frequency}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(toViewAmount(item.amount, item.frequency, viewMode), currency)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {perLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition disabled:opacity-50"
                  >
                    {deletingId === item.id ? t('deleting') : t('delete')}
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
      {renderItems(incomeItems, t('income'), 'bg-green-50 dark:bg-green-900/20', t('noIncomeItems'))}
      {renderItems(expenseItems, t('expenses'), 'bg-red-50 dark:bg-red-900/20', t('noExpenseItems'))}
    </div>
  )
}
