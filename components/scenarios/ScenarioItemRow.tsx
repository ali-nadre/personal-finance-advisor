'use client'

import { useRouter } from 'next/navigation'
import { deleteScenarioItem } from '@/app/actions/scenarios'
import { formatCurrency } from '@/lib/currency'
import type { ScenarioItem } from '@/types/database'
import type { Currency } from '@/types/database'

interface Props {
  item: ScenarioItem
  currency?: Currency
}

export default function ScenarioItemRow({ item, currency = 'USD' }: Props) {
  const router = useRouter()

  async function handleDelete() {
    await deleteScenarioItem(item.id)
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 group">
      <span className="text-sm text-gray-800">{item.label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${item.category_type === 'income' ? 'text-green-700' : 'text-gray-800'}`}>
          {formatCurrency(item.monthly_amount, currency)}/mo
        </span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition text-lg leading-none"
          title="Remove"
        >
          ×
        </button>
      </div>
    </div>
  )
}
