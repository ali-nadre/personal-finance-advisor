'use client'

import { useState } from 'react'
import type { Household } from '@/types/database'
import CreateHouseholdModal from './CreateHouseholdModal'
import Link from 'next/link'

export default function HouseholdSelector({
  households,
  currentHouseholdId,
}: {
  households: Household[]
  currentHouseholdId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentHousehold = households.find((h) => h.id === currentHouseholdId)

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="font-medium">
            {currentHousehold?.name || 'Select Household'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            ></div>
            <div className="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-2">
                {households.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    No households yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {households.map((household) => (
                      <Link
                        key={household.id}
                        href={`/dashboard/households/${household.id}`}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm transition ${
                          household.id === currentHouseholdId
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {household.name}
                      </Link>
                    ))}
                  </div>
                )}
                <hr className="my-2" />
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setIsModalOpen(true)
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Household
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateHouseholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
