'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/context'

interface Props {
  householdId: string
}

export default function NavLinks({ householdId }: Props) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const NAV_ITEMS = [
    { label: t('cashFlow'), path: 'budget' },
    { label: t('transactions'), path: 'transactions' },
    { label: t('scenarios'), path: 'scenarios', pro: true },
    { label: t('goals'), path: 'goals', pro: true },
    { label: t('advisor'), path: 'advisor', pro: true },
  ]

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
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
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
