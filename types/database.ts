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
