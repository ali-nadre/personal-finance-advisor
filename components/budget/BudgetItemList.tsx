'use client'

import { useState } from 'react'
import type { BudgetItemWithCategory, Category, Currency } from '@/types/database'
import { useLanguage } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/currency'
import BudgetItemRow from './BudgetItemRow'

interface Props {
  items: BudgetItemWithCategory[]
  categories: Category[]
  householdId: string
  currency?: Currency
  viewMode?: 'yearly' | 'monthly'
}

function toAnnual(amount: number, frequency: string): number {
  if (frequency === 'monthly') return amount * 12
  if (frequency === 'quarterly') return amount * 4
  return amount
}

function CategoryGroup({
  categoryId,
  categoryName,
  items,
  sameTypeCategories,
  currency,
  viewMode,
}: {
  categoryId: string
  categoryName: string
  items: BudgetItemWithCategory[]
  sameTypeCategories: Category[]
  currency: Currency
  viewMode: 'yearly' | 'monthly'
}) {
  const [open, setOpen] = useState(true)

  const annualTotal = items.reduce((sum, item) => sum + toAnnual(item.amount, item.frequency), 0)
  const displayTotal = viewMode === 'monthly' ? annualTotal / 12 : annualTotal
  const perLabel = viewMode === 'monthly' ? '/mo' : '/yr'

  return (
    <div
      id={`budget-category-${categoryId}`}
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden scroll-mt-20"
    >
      {/* Group header — click to collapse */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`transition-transform duration-200 text-gray-400 ${open ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{categoryName}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <span className="font-bold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-4">
          {formatCurrency(displayTotal, currency)}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-0.5">{perLabel}</span>
        </span>
      </button>

      {/* Items */}
      {open && (
        <div className="p-3 space-y-2 bg-white dark:bg-gray-800">
          {items.map((item) => (
            <BudgetItemRow
              key={item.id}
              item={item}
              sameTypeCategories={sameTypeCategories}
              currency={currency}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BudgetItemList({ items, categories, householdId: _householdId, currency = 'USD', viewMode = 'yearly' }: Props) {
  const { t } = useLanguage()

  const incomeItems = items.filter((item) => item.category.type === 'income')
  const expenseItems = items.filter((item) => item.category.type === 'expense')
  const savingsItems = items.filter((item) => item.category.type === 'savings')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const savingsCategories = categories.filter((c) => c.type === 'savings')

  // Group items by category_id, preserving category order
  function groupByCategory(sectionItems: BudgetItemWithCategory[]): { categoryId: string; categoryName: string; items: BudgetItemWithCategory[] }[] {
    const map = new Map<string, { categoryId: string; categoryName: string; items: BudgetItemWithCategory[] }>()
    for (const item of sectionItems) {
      const existing = map.get(item.category_id)
      if (existing) {
        existing.items.push(item)
      } else {
        map.set(item.category_id, { categoryId: item.category_id, categoryName: item.category.name, items: [item] })
      }
    }
    return Array.from(map.values())
  }

  const renderSection = (
    sectionItems: BudgetItemWithCategory[],
    sameTypeCategories: Category[],
    title: string,
    colorClass: string,
    emptyMsg: string,
    sectionId: string
  ) => {
    const groups = groupByCategory(sectionItems)
    return (
      <div id={sectionId} className="bg-white dark:bg-gray-800 rounded-lg shadow scroll-mt-20">
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${colorClass}`}>
          <h2 className="text-xl font-semibold dark:text-gray-100">{title}</h2>
        </div>
        <div className="p-4 sm:p-6">
          {sectionItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{emptyMsg}</p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <CategoryGroup
                  key={group.categoryId}
                  categoryId={group.categoryId}
                  categoryName={group.categoryName}
                  items={group.items}
                  sameTypeCategories={sameTypeCategories}
                  currency={currency}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderSection(incomeItems, incomeCategories, t('income'), 'bg-green-50 dark:bg-green-900/20', t('noIncomeItems'), 'budget-section-income')}
      {renderSection(expenseItems, expenseCategories, t('expenses'), 'bg-red-50 dark:bg-red-900/20', t('noExpenseItems'), 'budget-section-expense')}
      {renderSection(savingsItems, savingsCategories, t('savings'), 'bg-purple-50 dark:bg-purple-900/20', t('noSavingsItems'), 'budget-section-savings')}
    </div>
  )
}
