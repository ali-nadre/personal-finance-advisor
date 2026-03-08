'use client'

import { useState } from 'react'
import type { Category, Currency } from '@/types/database'
import AddBudgetItemModal from './AddBudgetItemModal'

interface Props {
  householdId: string
  categories: Category[]
  currency: Currency
}

export default function AddBudgetItemButton({ householdId, categories, currency }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        + Add Budget Item
      </button>

      {isOpen && (
        <AddBudgetItemModal
          householdId={householdId}
          categories={categories}
          currency={currency}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
