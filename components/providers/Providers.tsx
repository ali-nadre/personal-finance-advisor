'use client'

import { LanguageProvider } from '@/lib/i18n/context'
import { ThemeProvider } from '@/lib/theme/context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  )
}
