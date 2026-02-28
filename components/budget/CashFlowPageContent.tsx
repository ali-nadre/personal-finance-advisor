'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import BudgetSummary from './BudgetSummary'
import BudgetItemList from './BudgetItemList'
import BudgetVsActualView from './BudgetVsActual'
import SpendingByCategoryChart from '@/components/charts/SpendingByCategoryChart'
import BudgetVsActualChart from '@/components/charts/BudgetVsActualChart'
import type { BudgetSummary as BudgetSummaryType } from '@/app/actions/budgets'
import type { BudgetItemWithCategory, Category, BudgetVsActual, Currency } from '@/types/database'

interface Props {
  summary: BudgetSummaryType
  budgetItems: BudgetItemWithCategory[]
  categories: Category[]
  budgetVsActual: BudgetVsActual[]
  currency: Currency
  householdId: string
  monthName: string
  currentYear: number
  householdName: string
}

export default function CashFlowPageContent({
  summary,
  budgetItems,
  categories,
  budgetVsActual,
  currency,
  householdId,
  monthName,
  currentYear,
  householdName,
}: Props) {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly')
  const { t } = useLanguage()

  const summaryLabels = {
    totalIncome: t('totalIncome'),
    totalExpenses: t('totalExpenses'),
    balance: t('balance'),
    projection: viewMode === 'monthly' ? t('monthlyAverage') : t('annualProjection'),
    surplus: t('surplus'),
    deficit: t('deficit'),
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('cashFlow')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{householdName} · {currentYear}</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-semibold">
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-4 py-2 transition ${
              viewMode === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('yearly')}
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 transition ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('monthly')}
          </button>
        </div>
      </div>

      <BudgetSummary
        summary={summary}
        currency={currency}
        viewMode={viewMode}
        labels={summaryLabels}
      />

      {/* Charts row */}
      {summary.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Expenses by Category ({viewMode === 'monthly' ? 'monthly' : 'annual'})
            </h3>
            <SpendingByCategoryChart
              data={summary.byCategory}
              currency={currency}
              type="expense"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Budget vs Actual — {monthName}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Blue = budgeted · Green = under · Red = over</p>
            <BudgetVsActualChart data={budgetVsActual} currency={currency} />
          </div>
        </div>
      )}

      {/* Budget vs Actual progress bars */}
      {budgetVsActual.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{monthName} {currentYear}</p>
          <BudgetVsActualView data={budgetVsActual} currency={currency} />
        </div>
      )}

      {/* Item list */}
      {categories.length > 0 && (
        <BudgetItemList
          items={budgetItems}
          categories={categories}
          householdId={householdId}
          currency={currency}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}
