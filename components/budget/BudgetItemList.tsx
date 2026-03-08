'use client'

import type { BudgetItemWithCategory, Category, Currency } from '@/types/database'
import { useLanguage } from '@/lib/i18n/context'
import BudgetItemRow from './BudgetItemRow'

interface Props {
  items: BudgetItemWithCategory[]
  categories: Category[]
  householdId: string
  currency?: Currency
  viewMode?: 'yearly' | 'monthly'
}

export default function BudgetItemList({ items, categories, householdId, currency = 'USD', viewMode = 'yearly' }: Props) {
  const { t } = useLanguage()

  const incomeItems = items.filter((item) => item.category.type === 'income')
  const expenseItems = items.filter((item) => item.category.type === 'expense')
  const savingsItems = items.filter((item) => item.category.type === 'savings')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const savingsCategories = categories.filter((c) => c.type === 'savings')

  const renderSection = (
    itemsList: BudgetItemWithCategory[],
    sameTypeCategories: Category[],
    title: string,
    colorClass: string,
    emptyMsg: string,
    sectionId: string
  ) => (
    <div id={sectionId} className="bg-white dark:bg-gray-800 rounded-lg shadow scroll-mt-20">
      <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${colorClass}`}>
        <h2 className="text-xl font-semibold dark:text-gray-100">{title}</h2>
      </div>
      <div className="p-6">
        {itemsList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{emptyMsg}</p>
        ) : (
          <div className="space-y-3">
            {itemsList.map((item) => (
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
    </div>
  )

  return (
    <div className="space-y-6">
      {renderSection(incomeItems, incomeCategories, t('income'), 'bg-green-50 dark:bg-green-900/20', t('noIncomeItems'), 'budget-section-income')}
      {renderSection(expenseItems, expenseCategories, t('expenses'), 'bg-red-50 dark:bg-red-900/20', t('noExpenseItems'), 'budget-section-expense')}
      {renderSection(savingsItems, savingsCategories, t('savings'), 'bg-purple-50 dark:bg-purple-900/20', t('noSavingsItems'), 'budget-section-savings')}
    </div>
  )
}
