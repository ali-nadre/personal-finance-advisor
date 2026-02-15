export type Permission = 'read' | 'write'

export interface Household {
  id: string
  name: string
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
}

export interface UpdateHouseholdInput {
  id: string
  name: string
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
