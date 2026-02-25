'use client'

import { useState } from 'react'
import AddTransactionModal from './AddTransactionModal'
import type { Category } from '@/types/database'

interface Props {
  householdId: string
  categories: Category[]
}

export default function AddTransactionButton({ householdId, categories }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        + Add Transaction
      </button>

      {showModal && (
        <AddTransactionModal
          householdId={householdId}
          categories={categories}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
