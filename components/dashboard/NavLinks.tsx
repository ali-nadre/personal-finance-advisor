'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  householdId: string
}

const NAV_ITEMS = [
  { label: 'Cash Flow', path: 'budget' },
  { label: 'Transactions', path: 'transactions' },
  { label: 'Scenarios', path: 'scenarios', pro: true },
  { label: 'Goals', path: 'goals', pro: true },
  { label: 'Advisor', path: 'advisor', pro: true },
]

export default function NavLinks({ householdId }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map(({ label, path, pro }) => {
        const href = `/dashboard/households/${householdId}/${path}`
        const isActive = pathname.includes(`/${path}`)

        return (
          <Link
            key={path}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {label}
            {pro && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white leading-none">
                Pro
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
