'use client'

import { useLanguage } from '@/lib/i18n/context'
import { useTheme } from '@/lib/theme/context'

export default function NavControls() {
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      {/* Language toggle */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-semibold">
        <button
          onClick={() => setLanguage('en')}
          className={`px-2 py-1 transition ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('fr')}
          className={`px-2 py-1 transition ${
            language === 'fr'
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          FR
        </button>
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          // Moon icon
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          // Sun icon
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
