'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTransaction } from '@/app/actions/transactions'
import { formatCurrency } from '@/lib/currency'
import type { TransactionWithCategory, Category, Currency, CategoryType } from '@/types/database'

interface Props {
  transactions: TransactionWithCategory[]
  categories: Category[]
  householdId: string
  currency?: Currency
}

export default function TransactionList({ transactions, categories, householdId, currency = 'USD' }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<CategoryType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false
    return true
  })

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    setDeletingId(transactionId)
    const { error } = await deleteTransaction(transactionId)

    if (error) {
      alert('Failed to delete transaction: ' + error)
    } else {
      router.refresh()
    }
    setDeletingId(null)
  }

  const totalIncome = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpense = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'expense', 'income'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                filterType === type
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type === 'all' ? 'All' : type === 'income' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-green-600 font-semibold">
            Income: {formatCurrency(totalIncome, currency)}
          </span>
          <span className="text-red-600 font-semibold">
            Expenses: {formatCurrency(totalExpense, currency)}
          </span>
          <span className={`font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            Net: {formatCurrency(totalIncome - totalExpense, currency)}
          </span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found. Add your first transaction to start tracking!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {tx.category.name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        tx.type === 'income'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-sm text-gray-500 truncate">{tx.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className={`font-bold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.transaction_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    className="px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                  >
                    {deletingId === tx.id ? '...' : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
