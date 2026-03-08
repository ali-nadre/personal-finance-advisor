'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import BudgetSummary from './BudgetSummary'
import BudgetItemList from './BudgetItemList'
import YearSelector from './YearSelector'
import SetBeginningBalanceModal from './SetBeginningBalanceModal'
import CopyItemsModal from './CopyItemsModal'
import SpendingByCategoryChart from '@/components/charts/SpendingByCategoryChart'
import { formatCurrency } from '@/lib/currency'
import type { BudgetSummary as BudgetSummaryType } from '@/app/actions/budgets'
import type { BudgetItemWithCategory, Category, Currency } from '@/types/database'

interface Props {
  summary: BudgetSummaryType | null
  budgetItems: BudgetItemWithCategory[]
  categories: Category[]
  currency: Currency
  householdId: string
  selectedYear: number
  currentYear: number
  householdName: string
  beginningBalance: number
}

export default function CashFlowPageContent({
  summary,
  budgetItems,
  categories,
  currency,
  householdId,
  selectedYear,
  currentYear,
  householdName,
  beginningBalance,
}: Props) {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly')
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const { t } = useLanguage()

  const summaryLabels = {
    totalIncome: t('totalIncome'),
    totalExpenses: t('totalExpenses'),
    totalSavings: t('totalSavings'),
    balance: t('balance'),
    projection: viewMode === 'monthly' ? t('monthlyAverage') : t('annualProjection'),
    surplus: t('surplus'),
    deficit: t('deficit'),
  }

  // Projection calculation (always annual)
  const netCashFlow = summary ? summary.totalIncome - summary.totalExpense - summary.totalSavings : 0
  const projectedEndBalance = beginningBalance + netCashFlow

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('cashFlow')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-sm sm:text-base">{householdName}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <YearSelector householdId={householdId} selectedYear={selectedYear} />

          {/* Copy items button */}
          <button
            onClick={() => setShowCopyModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            title="Copy items from another year"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden sm:inline">Copy from year</span>
          </button>

          {/* Yearly/Monthly toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-semibold">
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 sm:px-4 py-2 transition ${
                viewMode === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t('yearly')}
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 sm:px-4 py-2 transition ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t('monthly')}
            </button>
          </div>
        </div>
      </div>

      {/* Budget summary cards */}
      {summary ? (
        <BudgetSummary
          summary={summary}
          currency={currency}
          viewMode={viewMode}
          labels={summaryLabels}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Add income and expense items to see your Cash Flow summary.
          </p>
        </div>
      )}

      {/* Beginning balance + projection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {selectedYear} Year Projection
          </h3>
          <button
            onClick={() => setShowBalanceModal(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition"
          >
            {beginningBalance !== 0 ? 'Edit balance' : '+ Set beginning balance'}
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Beginning Balance (Jan 1)</span>
            <span className={`font-semibold ${beginningBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(beginningBalance, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              + Net Cash Flow ({viewMode === 'monthly' ? 'monthly avg' : 'annual'})
            </span>
            <span className={`font-semibold ${netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(viewMode === 'monthly' ? netCashFlow / 12 : netCashFlow, currency)}
            </span>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">= Projected Balance (Dec 31)</span>
            <span className={`text-xl font-bold ${projectedEndBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(projectedEndBalance, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      {summary && summary.byCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Expenses by Category ({viewMode === 'monthly' ? 'monthly' : 'annual'})
          </h3>
          <SpendingByCategoryChart
            data={summary.byCategory}
            currency={currency}
            type="expense"
            viewMode={viewMode}
          />
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

      {/* Modals */}
      {showBalanceModal && (
        <SetBeginningBalanceModal
          householdId={householdId}
          year={selectedYear}
          currentBalance={beginningBalance}
          currency={currency}
          onClose={() => setShowBalanceModal(false)}
        />
      )}
      {showCopyModal && (
        <CopyItemsModal
          householdId={householdId}
          selectedYear={selectedYear}
          currentYear={currentYear}
          currency={currency}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </div>
  )
}
