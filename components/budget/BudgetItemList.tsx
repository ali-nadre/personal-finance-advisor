'use client'

import { useState, useEffect } from 'react'
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

// Subtle chevron icon
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function CategoryGroup({
  categoryId,
  categoryName,
  items,
  sameTypeCategories,
  currency,
  viewMode,
  globalOpen,
}: {
  categoryId: string
  categoryName: string
  items: BudgetItemWithCategory[]
  sameTypeCategories: Category[]
  currency: Currency
  viewMode: 'yearly' | 'monthly'
  globalOpen: boolean
}) {
  const [open, setOpen] = useState(globalOpen)

  // Sync when global toggle changes
  useEffect(() => { setOpen(globalOpen) }, [globalOpen])

  const annualTotal = items.reduce((sum, item) => sum + toAnnual(item.amount, item.frequency), 0)
  const displayTotal = viewMode === 'monthly' ? annualTotal / 12 : annualTotal
  const perLabel = viewMode === 'monthly' ? '/mo' : '/yr'

  return (
    <div
      id={`budget-category-${categoryId}`}
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden scroll-mt-20"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Chevron open={open} />
          <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{categoryName}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {items.length > 1 ? `${items.length} items` : ''}
          </span>
        </div>
        <span className="font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0 ml-4 text-sm">
          {formatCurrency(displayTotal, currency)}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-0.5">{perLabel}</span>
        </span>
      </button>

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
  const [incomeOpen, setIncomeOpen] = useState(true)
  const [expenseOpen, setExpenseOpen] = useState(true)
  const [savingsOpen, setSavingsOpen] = useState(true)

  const incomeItems = items.filter((item) => item.category.type === 'income')
  const expenseItems = items.filter((item) => item.category.type === 'expense')
  const savingsItems = items.filter((item) => item.category.type === 'savings')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const savingsCategories = categories.filter((c) => c.type === 'savings')

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
    sectionId: string,
    sectionOpen: boolean,
    setSectionOpen: (v: boolean) => void,
  ) => {
    const groups = groupByCategory(sectionItems)
    return (
      <div id={sectionId} className="bg-white dark:bg-gray-800 rounded-lg shadow scroll-mt-20">
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 ${colorClass} flex items-center justify-between`}>
          <h2 className="text-xl font-semibold dark:text-gray-100">{title}</h2>
          {sectionItems.length > 0 && (
            <button
              onClick={() => setSectionOpen(!sectionOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <Chevron open={sectionOpen} />
              {sectionOpen ? 'Collapse all' : 'Expand all'}
            </button>
          )}
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
                  globalOpen={sectionOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        {renderSection([], incomeCategories, t('income'), 'bg-green-50 dark:bg-green-900/20', t('noIncomeItems'), 'budget-section-income', incomeOpen, setIncomeOpen)}
        {renderSection([], expenseCategories, t('expenses'), 'bg-red-50 dark:bg-red-900/20', t('noExpenseItems'), 'budget-section-expense', expenseOpen, setExpenseOpen)}
        {renderSection([], savingsCategories, t('savings'), 'bg-purple-50 dark:bg-purple-900/20', t('noSavingsItems'), 'budget-section-savings', savingsOpen, setSavingsOpen)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderSection(incomeItems, incomeCategories, t('income'), 'bg-green-50 dark:bg-green-900/20', t('noIncomeItems'), 'budget-section-income', incomeOpen, setIncomeOpen)}
      {renderSection(expenseItems, expenseCategories, t('expenses'), 'bg-red-50 dark:bg-red-900/20', t('noExpenseItems'), 'budget-section-expense', expenseOpen, setExpenseOpen)}
      {renderSection(savingsItems, savingsCategories, t('savings'), 'bg-purple-50 dark:bg-purple-900/20', t('noSavingsItems'), 'budget-section-savings', savingsOpen, setSavingsOpen)}
    </div>
  )
}
