export type Permission = 'read' | 'write'

export type Currency =
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'SEK' | 'NZD'
  | 'INR' | 'BRL' | 'ZAR' | 'MXN' | 'SGD' | 'HKD' | 'NOK' | 'KRW' | 'TRY' | 'RUB'
  | 'AED' | 'SAR' | 'EGP' | 'MAD' | 'NGN' | 'KES' | 'GHS' | 'TZS' | 'UGX' | 'DZD'

export interface Household {
  id: string
  name: string
  currency: Currency
  created_by: string
  created_at: string
  updated_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  permission: Permission
  invited_by: string | null
  joined_at: string
}

export interface HouseholdWithMembers extends Household {
  members: (HouseholdMember & {
    user: {
      email: string
      user_metadata: {
        full_name?: string
      }
    }
  })[]
}

export interface CreateHouseholdInput {
  name: string
  currency?: Currency
}

export interface UpdateHouseholdInput {
  id: string
  name: string
  currency?: Currency
}

export interface AddMemberInput {
  household_id: string
  user_email: string
  permission: Permission
}

export interface UpdateMemberPermissionInput {
  member_id: string
  permission: Permission
}

// Budget types
export type CategoryType = 'income' | 'expense'
export type Frequency = 'monthly' | 'quarterly' | 'yearly'

export interface Category {
  id: string
  household_id: string
  name: string
  type: CategoryType
  icon: string | null
  created_at: string
  updated_at: string
}

export interface BudgetItem {
  id: string
  household_id: string
  category_id: string
  amount: number
  frequency: Frequency
  year: number
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface BudgetItemWithCategory extends BudgetItem {
  category: Category
}

export interface CreateCategoryInput {
  household_id: string
  name: string
  type: CategoryType
  icon?: string
}

export interface UpdateCategoryInput {
  id: string
  name: string
  icon?: string
}

export interface CreateBudgetItemInput {
  household_id: string
  category_id: string
  amount: number
  frequency: Frequency
  year: number
  description?: string
}

export interface UpdateBudgetItemInput {
  id: string
  category_id?: string
  amount?: number
  frequency?: Frequency
  year?: number
  description?: string
}

// Transaction types
export interface Transaction {
  id: string
  household_id: string
  category_id: string
  amount: number
  type: CategoryType
  description: string | null
  transaction_date: string
  is_recurring: boolean
  recurring_item_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface TransactionWithCategory extends Transaction {
  category: Category
}

export interface CreateTransactionInput {
  household_id: string
  category_id: string
  amount: number
  type: CategoryType
  description?: string
  transaction_date?: string
  is_recurring?: boolean
  recurring_item_id?: string
}

export interface UpdateTransactionInput {
  id: string
  category_id?: string
  amount?: number
  type?: CategoryType
  description?: string
  transaction_date?: string
  is_recurring?: boolean
}

export interface TransactionFilters {
  type?: CategoryType
  category_id?: string
  date_from?: string
  date_to?: string
}

export interface BudgetVsActual {
  categoryId: string
  categoryName: string
  categoryType: CategoryType
  budgeted: number
  actual: number
  difference: number
  percentUsed: number
}

// Scenario types
export interface Scenario {
  id: string
  household_id: string
  name: string
  description: string | null
  created_by: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ScenarioItem {
  id: string
  scenario_id: string
  label: string
  category_type: CategoryType
  monthly_amount: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ScenarioWithItems extends Scenario {
  items: ScenarioItem[]
}

export interface CreateScenarioInput {
  household_id: string
  name: string
  description?: string
}

export interface AddScenarioItemInput {
  scenario_id: string
  label: string
  category_type: CategoryType
  monthly_amount: number
}

export interface ProjectionMonth {
  monthIndex: number
  label: string
  income: number
  expenses: number
  net: number
  cumulativeSavings: number
}

// Goal types
export type GoalType =
  | 'savings'
  | 'emergency_fund'
  | 'debt_payoff'
  | 'vacation'
  | 'home_purchase'
  | 'education'
  | 'other'

export interface FinancialGoal {
  id: string
  household_id: string
  name: string
  description: string | null
  goal_type: GoalType
  target_amount: number
  current_amount: number
  deadline: string | null
  is_completed: boolean
  is_archived: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  amount: number
  note: string | null
  contributed_at: string
  created_by: string
  created_at: string
}

export interface CreateGoalInput {
  household_id: string
  name: string
  description?: string
  goal_type: GoalType
  target_amount: number
  current_amount?: number
  deadline?: string
}

export interface AddContributionInput {
  goal_id: string
  amount: number
  note?: string
  contributed_at?: string
}
