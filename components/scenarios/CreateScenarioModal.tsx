'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createScenario } from '@/app/actions/scenarios'

interface Props {
  householdId: string
  hasBudget: boolean
  onClose: () => void
}

export default function CreateScenarioModal({ householdId, hasBudget, onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cloneFromBudget, setCloneFromBudget] = useState(hasBudget)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const { data, error: err } = await createScenario(
      { household_id: householdId, name: name.trim(), description: description.trim() || undefined },
      cloneFromBudget
    )

    if (err || !data) {
      setError(err ?? 'Failed to create scenario')
      setLoading(false)
      return
    }

    router.push(`/dashboard/households/${householdId}/scenarios/${data.id}`)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">New Scenario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Model a "what if" — new job, big expense, lifestyle change.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Scenario name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New job at $85k, Move to Austin..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you exploring with this scenario?"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {hasBudget && (
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={cloneFromBudget}
                onChange={(e) => setCloneFromBudget(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Start from my current budget</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pre-fills income & expenses from your {new Date().getFullYear()} budget so you can tweak from there.
                </p>
              </div>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
