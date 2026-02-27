'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { archiveScenario } from '@/app/actions/scenarios'

interface Props {
  scenarioId: string
  householdId: string
}

export default function ArchiveScenarioButton({ scenarioId, householdId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleArchive() {
    await archiveScenario(scenarioId)
    router.push(`/dashboard/households/${householdId}/scenarios`)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Delete this scenario?</span>
        <button
          onClick={handleArchive}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Yes, delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
    >
      Delete
    </button>
  )
}
