'use client'

import { useState } from 'react'
import CreateScenarioModal from './CreateScenarioModal'

interface Props {
  householdId: string
  hasBudget: boolean
}

export default function CreateScenarioButton({ householdId, hasBudget }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
      >
        + New Scenario
      </button>
      {open && (
        <CreateScenarioModal
          householdId={householdId}
          hasBudget={hasBudget}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
