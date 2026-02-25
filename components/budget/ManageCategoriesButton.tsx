'use client'

import { useState } from 'react'
import ManageCategoriesModal from './ManageCategoriesModal'

interface Props {
  householdId: string
}

export default function ManageCategoriesButton({ householdId }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
      >
        Manage Categories
      </button>

      {isOpen && (
        <ManageCategoriesModal
          householdId={householdId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
