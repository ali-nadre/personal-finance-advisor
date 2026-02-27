import type { GoalType } from '@/types/database'

export const GOAL_TYPE_CONFIG: Record<
  GoalType,
  { label: string; color: string; bg: string; border: string }
> = {
  savings: {
    label: 'Savings',
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-200',
  },
  emergency_fund: {
    label: 'Emergency Fund',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
  },
  debt_payoff: {
    label: 'Debt Payoff',
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200',
  },
  vacation: {
    label: 'Vacation',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  home_purchase: {
    label: 'Home Purchase',
    color: 'text-indigo-700',
    bg: 'bg-indigo-100',
    border: 'border-indigo-200',
  },
  education: {
    label: 'Education',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
  },
  other: {
    label: 'Other',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
  },
}
