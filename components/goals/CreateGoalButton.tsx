'use client'

import { useState } from 'react'
import CreateGoalModal from './CreateGoalModal'

interface Props {
  householdId: string
}

export default function CreateGoalButton({ householdId }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
      >
        + New Goal
      </button>
      {open && <CreateGoalModal householdId={householdId} onClose={() => setOpen(false)} />}
    </>
  )
}
