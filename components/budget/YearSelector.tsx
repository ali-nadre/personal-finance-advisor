'use client'

import { useRouter } from 'next/navigation'

interface Props {
  householdId: string
  selectedYear: number
}

export default function YearSelector({ householdId, selectedYear }: Props) {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 5
  const maxYear = currentYear + 5

  const go = (year: number) => {
    router.push(`/dashboard/households/${householdId}/budget?year=${year}`)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-1 py-1">
      <button
        onClick={() => go(selectedYear - 1)}
        disabled={selectedYear <= minYear}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Previous year"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="px-3 py-1 text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[52px] text-center">
        {selectedYear}
        {selectedYear === currentYear && (
          <span className="ml-1 text-xs font-normal text-blue-500">now</span>
        )}
      </span>

      <button
        onClick={() => go(selectedYear + 1)}
        disabled={selectedYear >= maxYear}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next year"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
